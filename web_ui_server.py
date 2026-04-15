from flask import Flask, render_template, send_from_directory, request, jsonify
from Eventit import GameSetup

app = Flask(__name__, template_folder='web_ui')
@app.route('/flight_game_run')
def flight_game_run():
    return render_template("index.html")

#Route Javascriptille kun loginiä painetaan Gamesetup luo yhteyden
@app.route("/api/db-login", methods=["POST"])
def db_login():
    data = request.get_json()
    user = data["user"]
    password = data["password"]

    conn = GameSetup.db_connection(user, password)
    cur = conn.cursor()

    return jsonify({"session": "ok"})

@app.route('/app.js')
def js():
    return send_from_directory('web_ui', 'app.js')

@app.route('/styles.css')
def css():
    return send_from_directory('web_ui', 'styles.css')

if __name__ == "__main__":
    app.run(debug=True)