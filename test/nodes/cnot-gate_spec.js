const util = require('util');
const testUtil = require('../test-util');
const nodeTestHelper = testUtil.nodeTestHelper;
const {FlowBuilder} = require('../flow-builder');
const cnotGateNode = require('../../nodes/quantum/cnot-gate/cnot-gate.js');
const snippets = require('../../nodes/snippets.js');

const flow = new FlowBuilder();

describe('CnotGateNode', function() {
  beforeEach(function(done) {
    nodeTestHelper.startServer(done);
  });

  afterEach(function(done) {
    flow.reset();
    nodeTestHelper.unload();
    nodeTestHelper.stopServer(done);
  });

  it('load node', function(done) {
    testUtil.isLoaded(cnotGateNode, 'cnot-gate', done);
  });

  xit('pass qubit through gate', function(done) {
    flow.add('quantum-circuit', 'n0', [['n1'], ['n1']],
        {structure: 'qubits', outputs: '2', qbitsreg: '2', cbitsreg: '2'});
    flow.add('cnot-gate', 'n1', [['n2'], ['n2']], {targetPosition: 'Upper'});
    flow.addOutput('n2');

    let payloadObject = [
      {structure: {qubits: 2, cbits: 2},
        register: undefined,
        qubit: 0},
      {structure: {qubits: 2, cbits: 2},
        register: undefined,
        qubit: 1},
    ];

    testUtil.qubitsPassedThroughGate(flow, payloadObject, done);
  });

  it('execute command', function(done) {
    let command = util.format(snippets.CNOT_GATE, '1', '0');
    let flow = new FlowBuilder();
    flow.add('quantum-circuit', 'n0', [['n1'], ['n1']],
        {structure: 'qubits', outputs: '2', qbitsreg: '2', cbitsreg: '1'});
    flow.add('cnot-gate', 'n1', [['n2']], {targetPosition: 'Upper'});
    flow.addOutput('n2');

    testUtil.commandExecuted(flow, command, done);
  });
});
