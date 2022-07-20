'use strict';
const Project = require('../models/project').Project;
const mongoose = require('mongoose');


module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      const filterParams = {...req.query};
      if (filterParams.open) {
        filterParams.open = filterParams.open === 'true' ? true : false;
      }
      if (filterParams._id) {
        filterParams._id = mongoose.Types.ObjectId(filterParams._id);
      }
      const paramsArray = [];
      for (let param in filterParams) {
        const key = `issues.${param}`;
        paramsArray.push({ $match: { [key]: filterParams[param] } });
      }
      Project.aggregate([
        { $match: { name: project} },
        { $unwind: '$issues' },
        ...paramsArray
      ]).exec((error, data) => {
        if (!data || !data.length) {
          res.json({});
          return
        }
        const filteredIssues = data.map(d => d.issues);
        res.json(filteredIssues);
      });
    })
    
    .post(function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      if (!issue_title || !issue_text || !created_by) {
        res.json({
          error: 'required field(s) missing'
        });
      } else {
        const newIssue = {
          issue_title,
          issue_text,
          created_on: new Date(),
          updated_on: new Date(),
          created_by,
          assigned_to: assigned_to || '',
          open: true,
          status_text: status_text || ''
        }
        Project.findOne({ name: project }, (error, projectFound) => {
          if (error) {
            console.log('POST error: error looking for project', error);
          }
          if (projectFound) {
            projectFound.issues.push(newIssue);
            projectFound.save((error, data) => {
              if (error) {
                console.log('POST: error saving to project', error);
              }
              if (data) {
                res.json(data.issues[data.issues.length - 1]);
              }
            });
          }
          if (!projectFound) {
            const newProject = new Project({
              name: project,
              issues: [newIssue]
            });
            newProject.save((error, data) => {
              if (error) {
                console.log('POST: error saving new project', error);
              }
              if (data) {
                res.json(data.issues[0]);
              }
            });
          }
        }); 
      }
    })
    
    .put(function (req, res){
      let project = req.params.project;
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
      if (!_id) {
        res.json({
          error: 'missing _id'
        });
        return;
      }
      if (!issue_title && !issue_text && !created_by && !assigned_to && !status_text && !open) {
        res.json({
          error: 'no update field(s) sent',
          _id
        });
        return;
      }
      Project.findOne({ name: project }, (error, projectFound) => {
        const updatedIssue = {
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          open
        };
        if (error) {
          console.log('PUT error: error looking for project', error);
          res.json({
            error: 'could not update',
            _id
          });
          return;
        }
        if (projectFound) {
          const issueToUpdate = projectFound.issues.id(_id);
          if (issueToUpdate) {
            for (let key in updatedIssue) {
              if (updatedIssue[key]) {
                issueToUpdate[key] = updatedIssue[key];
              }
            }
            issueToUpdate.updated_on = new Date();
          }
          if (!issueToUpdate) {
            res.json({
              error: 'could not update',
              _id
            });
            return;
          }
          projectFound.save((error, data) => {
            if (error) {
              console.log('PUT error: error updating issue', error);
              res.json({
                error: 'could not update',
                _id
              });
              return;
            }
            res.json({
              result: 'successfully updated',
              _id
            });
          });
        }
      });
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;
      if (!_id) {
        res.json({
          error: 'missing _id'
        });
        return;
      }
      if (_id && !mongoose.Types.ObjectId.isValid(_id)) {
        res.json({
          error: 'could not delete',
          _id
        });
        return;
      }
      Project.findOneAndUpdate({ name: project }, { $pull: { issues: { _id } } }, (error, data) => {
        if (error || !data) {
          console.log('DELETE error: error deleting issue', error);
          res.json({
            error: 'could not delete',
            _id
          });
        }
        if (data) {
          if (data.issues.id(_id)) {
            res.json({
              result: 'successfully deleted',
              _id
            });
          }
          if (!data.issues.id(_id)) {
            res.json({
              error: 'could not delete',
              _id
            });
          }
        }
      })
    });
    
};
