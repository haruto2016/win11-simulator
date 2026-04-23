"""
Windows 11 Simulator - Extension File Server
Serves win11_extension.js with proper CORS headers for TurboWarp.
Deployed on Railway.
"""

from flask import Flask, send_file, jsonify, Response
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)  # Allow all origins for TurboWarp

@app.route("/")
def index():
    return jsonify({
        "name": "Windows 11 Simulator Extension Server",
        "version": "1.0.0",
        "extension_url": "/win11_extension.js",
        "usage": "TurboWarp > 拡張機能 > カスタム拡張機能 > URLを入力 > このサーバーのURL/win11_extension.js",
    })

@app.route("/win11_extension.js")
def serve_extension():
    ext_path = os.path.join(os.path.dirname(__file__), "win11_extension.js")
    with open(ext_path, "r", encoding="utf-8") as f:
        content = f.read()
    response = Response(content, mimetype="application/javascript")
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Cache-Control"] = "public, max-age=3600"
    return response

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
