const mongoose = require("mongoose");

/**
 * Schema Mongoose per i progetti
 * Contiene i file del progetto e i riferimenti all'utente proprietario
 */
const ProjectSchema = new mongoose.Schema({
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  files: { 
    type: Object, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("Project", ProjectSchema);