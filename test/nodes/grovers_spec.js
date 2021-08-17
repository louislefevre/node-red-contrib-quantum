const groversNode = require('../../quantum/nodes/grovers/grovers.js');
const testUtil = require('../test-util');
const nodeTestHelper = testUtil.nodeTestHelper;
const assert = require('chai').assert;


describe('GroversNode', function() {
  beforeEach(function(done) {
    nodeTestHelper.startServer(done);
  });

  afterEach(function(done) {
    nodeTestHelper.unload();
    nodeTestHelper.stopServer(done);
  });

  it('load node', function(done) {
    testUtil.isLoaded(groversNode, 'grovers', done);
  });

  it('default name outputs correctly', function(done) {
    let flow = [{id: 'groversNode', type: 'grovers', wires: []}];
    nodeTestHelper.load(groversNode, flow, function() {
      let groversTestNode = nodeTestHelper.getNode('groversNode');
      groversTestNode.should.have.property('name', 'Grovers');
      done();
    });
  });

  it('return success output on valid input', function(done) {
    let flow = [{id: 'groversNode', type: 'grovers', wires: [['helperNode']]},
      {id: 'helperNode', type: 'helper'}];

    nodeTestHelper.load(groversNode, flow, function() {
      let groversTestNode = nodeTestHelper.getNode('groversNode');
      let helperNode = nodeTestHelper.getNode('helperNode');

      helperNode.on('input', function(msg) {
        const expectedPayload = 'Top measurement: 111111\n' + 'iterations = 6';
        try {
          assert.strictEqual(msg.payload, expectedPayload);
          done();
        } catch (err) {
          done(err);
        }
      });

      groversTestNode.receive({payload: '111111'});
    });
  });
});
