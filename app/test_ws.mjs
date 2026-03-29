import { io } from "socket.io-client";

async function run() {
    console.log("Logging in as vendor@vendor.com...");
    const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new.vendor.test@example.com", password: "password12345" }) 
    });
    
    if (!res.ok) {
        console.error("Login failed!", await res.text());
        return;
    }
    const data = await res.json();
    console.log("Got token.");
    
    console.log("Connecting to Community Server...");
    const socket = io("http://localhost:3005", {
        auth: { token: data.token }
    });
    
    socket.on("connect", () => {
        console.log("Socket Connected! Socket ID:", socket.id);
        console.log("Emitting join_room 500015...");
        socket.emit("join_room", "500015");
    });
    
    socket.on("connect_error", (err) => {
        console.error("Connection Error:", err.message);
    });
    
    socket.on("chat_history", (history) => {
        console.log("RECEIVED chat_history! Length:", history.length);
        if (history.length >= 0) {
            console.log("SUCCESS");
            process.exit(0);
        }
    });

    socket.on("error_message", (err) => {
         console.error("RECEIVED error_message:", err.message);
    });
    
    setTimeout(() => {
        console.log("Timeout reached. Exiting.");
        process.exit(1);
    }, 5000);
}

run();
