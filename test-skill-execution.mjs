#!/usr/bin/env node
/**
 * 测试 Skill 工具执行和 newMessages 注入
 */

import { SkillTool } from './dist/tools/skill.js';
import { runWithCwd } from './dist/core/cwd-context.js';

console.log('=== Testing Skill Execution ===\n');

async function test() {
  const workingDir = process.cwd();

  await runWithCwd(workingDir, async () => {
    const skillTool = new SkillTool();

    console.log('1. Executing xlsx skill...');
    const result = await skillTool.execute({
      skill: 'document-skills:xlsx',
      args: 'analyze data.xlsx'
    }, {});

    console.log('\n2. Skill execution result:');
    console.log('   - Success:', result.success);
    console.log('   - Output:', result.output);
    console.log('   - Has newMessages:', !!result.newMessages);
    console.log('   - newMessages count:', result.newMessages?.length || 0);

    if (result.newMessages && result.newMessages.length > 0) {
      console.log('\n3. newMessages content:');
      for (const msg of result.newMessages) {
        console.log('   - Role:', msg.role);
        console.log('   - Content type:', msg.content[0]?.type);
        if (msg.content[0]?.type === 'text') {
          const text = msg.content[0].text;
          console.log('   - Content preview (first 500 chars):');
          console.log('     ', text.slice(0, 500).replace(/\n/g, '\n      '));
          console.log('   - Full content length:', text.length, 'chars');
        }
      }
    }

    console.log('\n✓ Test completed!');
  });
}

test().catch(err => {
  console.error('✗ Test failed:', err);
  process.exit(1);
});
