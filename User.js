const mongoose = require("mongoose");

/**
 * Schema Mongoose per gli utenti
 * Gestisce l'autenticazione e i ruoli (admin/user)
 */
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
    // 🔐 Nota: In produzione, la password dovrebbe essere criptata con bcrypt
  },
  role: { 
    type: String, 
    enum: ["admin", "user"], 
    default: "user" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("User", UserSchema);