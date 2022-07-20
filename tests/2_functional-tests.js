const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const should = chai.should();
const Project = require('../models/project').Project;

chai.use(chaiHttp);

let testIssueId;
suite('Functional Tests', function() {
  test('Create an issue with every field: POST to /api/issues/{project}', function (done) {
    let issue = {
      issue_title: 'Test title',
      issue_text: 'Test text',
      created_by: 'Test creator',
      assigned_to: 'Test assignee',
      status_text: 'Test status'
    }
    chai
      .request(server)
      .post('/api/issues/test')
      .send(issue)
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Test title');
        assert.equal(res.body.issue_text, 'Test text');
        assert.equal(res.body.created_by, 'Test creator');
        assert.equal(res.body.assigned_to, 'Test assignee');
        assert.equal(res.body.status_text, 'Test status');
        assert.equal(res.body.open, true);
        testIssueId = res.body._id;
        done();
      });
  });

  test('Create an issue with only required fields: POST to /api/issues/{project}', function (done) {
    let issue = {
      issue_title: 'Test title',
      issue_text: 'Test issue',
      created_by: 'Test creator'
    }
    chai
      .request(server)
      .post('/api/issues/test')
      .send(issue)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        assert.equal(res.body.issue_title, 'Test title');
        assert.equal(res.body.issue_text, 'Test issue');
        assert.equal(res.body.created_by, 'Test creator');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.equal(res.body.open, true);
        done();
      });
  });

  test('Create an issue with missing required fields: POST to /api/issues/{project}', function (done) {
    let issue = {
      issue_text: 'Test issue',
      created_by: 'Test creator'
    }
    chai
      .request(server)
      .post('/api/issues/test')
      .send(issue)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  test('View issues on a project: GET request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .get('/api/issues/test')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('array');
        done();
      });
  });

  test('View issues on a project with one filter: GET request to /api/issues/{project}', function(done) {
    chai
      .request(server)
      .get('/api/issues/test?open=true')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('array');
        done();
      });
  });

  test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function(done) {
    chai
      .request(server)
      .get('/api/issues/test?open=true&created_by=Test creator')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('array');
        done();
      });
  });

  test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .put('/api/issues/test')
      .send({ _id: testIssueId, issue_title: 'updated title'})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('result');
        assert.equal(res.body.result, 'successfully updated');
        res.body.should.have.property('_id');
        assert.equal(res.body._id, testIssueId);
        done();
      });
  });

  test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .put('/api/issues/test')
      .send({
        _id: testIssueId,
        issue_title: 'new title',
        issue_text: 'updated issue text'
      })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('result');
        assert.equal(res.body.result, 'successfully updated');
        res.body.should.have.property('_id');
        assert.equal(res.body._id, testIssueId);
        done();
      });
  });

  test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .put('/api/issues/test')
      .send({issue_title: 'failing update'})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });

  test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .put('/api/issues/test')
      .send({ _id: testIssueId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'no update field(s) sent');
        done();
      });
  });

  test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .put('/api/issues/test')
      .send({ _id: '1', issue_title: 'wrong id' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'could not update');
        res.body.should.have.property('_id');
        assert.equal(res.body._id, '1');
        done();
      });
  });

  test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .delete('/api/issues/test')
      .send({ _id: testIssueId })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('result');
        assert.equal(res.body.result, 'successfully deleted');
        res.body.should.have.property('_id');
        assert.equal(res.body._id, testIssueId);
        done();
      });
  });

  test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .delete('/api/issues/test')
      .send({ _id: '1' })
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'could not delete');
        res.body.should.have.property('_id');
        assert.equal(res.body._id, '1');
        done();
      });
  });

  test('Delete an issue with a missing _id: DELETE request to /api/issues/{project}', function (done) {
    chai
      .request(server)
      .delete('/api/issues/test')
      .send({})
      .end(function (err, res) {
        assert.equal(res.status, 200);
        res.body.should.be.a('object');
        res.body.should.have.property('error');
        assert.equal(res.body.error, 'missing _id');
        done();
      });
  });
  
});
