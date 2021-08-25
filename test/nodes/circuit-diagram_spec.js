const testUtil = require('../test-util');
const nodeTestHelper = testUtil.nodeTestHelper;
const {FlowBuilder} = require('../flow-builder');
const circuitDiagramNode = require('../../nodes/quantum/circuit-diagram/circuit-diagram.js');
const snippets = require('../../nodes/snippets.js');

const flow = new FlowBuilder();

describe('CircuitDiagramNode', function() {
  beforeEach(function(done) {
    nodeTestHelper.startServer(done);
  });

  afterEach(function(done) {
    flow.reset();
    nodeTestHelper.unload();
    nodeTestHelper.stopServer(done);
  });

  it('load node', function(done) {
    testUtil.isLoaded(circuitDiagramNode, 'circuit-diagram', done);
  });

  it('execute command', function(done) {
    let command = snippets.CIRCUIT_DIAGRAM + snippets.ENCODE_IMAGE;
    flow.add('quantum-circuit', 'n0', [['n1']], {structure: 'qubits', outputs: '1', qbitsreg: '1', cbitsreg: '1'});
    flow.add('hadamard-gate', 'n1', [['n2']]);
    flow.add('measure', 'n2', [['n3']], {selectedBit: '0'});
    flow.add('circuit-diagram', 'n3', [['n4']]);
    flow.addOutput('n4');

    testUtil.commandExecuted(flow, command, done);
  });
});
