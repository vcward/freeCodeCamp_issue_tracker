const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issues: [
    {
      issue_title: { type: String, required: true },
      issue_text: { type: String, required: true },
      created_on: Date,
      updated_on: Date,
      created_by: { type: String, required: true },
      assigned_to: String,
      open: Boolean,
      status_text: String
    }
  ]
});

const Project = mongoose.model('Project', projectSchema);

module.exports = {
  Project: Project
}