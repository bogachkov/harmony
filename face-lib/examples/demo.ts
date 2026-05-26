// Demonstrates the LLM tool surface: simulate an LLM picking a tool and arguments,
// invoke it through the dispatcher, write the resulting SVG to disk.
import { writeFileSync } from 'node:fs';
import { tools, invokeTool } from '../src/llm-tools.ts';

console.log('=== Tool schema (what an LLM sees) ===\n');
console.log(JSON.stringify(tools, null, 2));

console.log('\n=== Simulated LLM tool call: list_face_presets ===\n');
const presets = invokeTool('list_face_presets', {});
console.log(JSON.stringify(presets, null, 2));

console.log('\n=== Simulated LLM tool call: generate_face ===\n');
const args = {
  expression: 'angry',
  age: 'adult',
  presentation: 'masculine',
  overrides: { camera: { yaw: 0.3 }, style: { showConstruction: false } },
};
console.log('args:', JSON.stringify(args, null, 2));

const result = invokeTool('generate_face', args);
if (result.ok) {
  const svg = (result.result as { svg: string }).svg;
  writeFileSync('/tmp/demo-angry-3q.svg', svg);
  console.log(`\nOK — SVG written to /tmp/demo-angry-3q.svg (${svg.length} bytes)`);
} else {
  console.error('Tool error:', result.error);
}
