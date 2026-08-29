const fs = require("fs");
const path = require("path");

const appJsPath = path.join(__dirname, "src", "app.js");
let content = fs.readFileSync(appJsPath, "utf-8");

// We need to move the CORS block before the limiter
const corsStart = content.indexOf("const allowedOrigins = (process.env.FRONTEND_URL || \"\")");
const corsEnd = content.indexOf("app.use(express.json());");

if (corsStart !== -1 && corsEnd !== -1) {
    const corsCode = content.substring(corsStart, corsEnd);
    content = content.substring(0, corsStart) + content.substring(corsEnd);
    
    // Insert before limiter
    const limiterStart = content.indexOf("const limiter = rateLimit({");
    if (limiterStart !== -1) {
        content = content.substring(0, limiterStart) + corsCode + "\n" + content.substring(limiterStart);
        fs.writeFileSync(appJsPath, content);
        console.log("Fixed!");
    } else {
        console.log("Limiter not found");
    }
} else {
    console.log("CORS block not found");
}
