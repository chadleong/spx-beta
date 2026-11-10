from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)


def _fetch_yfinance(start: datetime, end: datetime):
    import yfinance as yf

    spx = yf.download("^GSPC", start=start, end=end, progress=False, auto_adjust=True)
    tny = yf.download("^TNX", start=start, end=end, progress=False, auto_adjust=True)
    if spx.empty or tny.empty:
        raise ValueError("Empty response from Yahoo Finance")

    # SPX returns in % (×100) so beta units match: % SPX move per 1pp yield change
    spx_close = spx["Close"].squeeze()
    tny_close = tny["Close"].squeeze()
    spx_returns = spx_close.pct_change().dropna() * 100
    tny_changes = tny_close.diff().dropna()
    return pd.DataFrame({"spx": spx_returns, "tny": tny_changes}).dropna()


def _generate_synthetic(start: datetime, end: datetime, seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic daily SPX returns and 10Y yield changes
    using correlated Ornstein-Uhlenbeck processes to produce
    time-varying beta behaviour similar to the reference chart.
    """
    rng = np.random.default_rng(seed)
    bdays = pd.bdate_range(start=start, end=end)
    n = len(bdays)

    # Simulate a slowly mean-reverting true beta (OU process)
    true_beta = np.zeros(n)
    kappa, mu, sigma_b = 0.02, 0.0, 2.5
    for t in range(1, n):
        true_beta[t] = true_beta[t - 1] + kappa * (mu - true_beta[t - 1]) + sigma_b * rng.standard_normal()

    # Yield changes in pp (std ~0.05pp/day, i.e. ~5bps)
    tny = rng.normal(0, 0.05, n)

    # SPX returns in % (std ~0.8%/day); driven by true_beta * yield_change + idio
    spx = true_beta * tny + rng.normal(0.04, 0.5, n)

    df = pd.DataFrame({"spx": spx, "tny": tny}, index=bdays)
    df.index = pd.DatetimeIndex(df.index)
    return df


def compute_rolling_beta(window: int = 21, use_synthetic: bool = False) -> tuple[list[dict], str]:
    end = datetime.today()
    start = end - timedelta(days=365 * 5)

    source = "live"
    if not use_synthetic:
        try:
            df = _fetch_yfinance(start, end)
        except Exception:
            df = _generate_synthetic(start, end)
            source = "synthetic"
    else:
        df = _generate_synthetic(start, end)
        source = "synthetic"

    betas = []
    for i in range(window - 1, len(df)):
        window_df = df.iloc[i - window + 1 : i + 1]
        x = window_df["tny"].values
        y = window_df["spx"].values
        var_x = np.var(x)
        beta = float(np.cov(y, x)[0, 1] / var_x) if var_x > 1e-12 else None
        betas.append({
            "date": df.index[i].strftime("%Y-%m-%d"),
            "beta": round(beta, 4) if beta is not None else None,
        })

    return betas, source


def write_beta_json(filepath: str | None = None, **kwargs):
    data, source = compute_rolling_beta(**kwargs)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if filepath is None:
        filepath = f"data/rolling_beta_{today}.json"
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    payload = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": source,
        "window": kwargs.get("window", 21),
        "data": data,
    }
    with open(filepath, "w") as f:
        json.dump(payload, f, indent=2)
    return filepath, len(data)


@app.route("/api/rolling-beta")
def rolling_beta():
    try:
        window = int(request.args.get("window", 21))
        window = max(5, min(window, 252))
        use_synthetic = request.args.get("synthetic", "false").lower() == "true"
        data, source = compute_rolling_beta(window=window, use_synthetic=use_synthetic)
        return jsonify({"status": "ok", "data": data, "source": source, "window": window})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    write_beta_json()
    app.run(host="0.0.0.0", port=3000, debug=False)
