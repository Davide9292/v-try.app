#!/usr/bin/env node

// Test different models with KIE AI
const API_KEY = '206157340d3a4e4e8b3c9f5e7a8b2d1c';
const BASE_URL = 'https://api.kie.ai/api/v1/jobs/createTask';

const MODELS_TO_TEST = [
  'google/nano-banana-edit',
  'nano-banana-edit',
  'nano-banana',
  'flux',
  'flux-dev',
  'flux-schnell',
  'stable-diffusion',
  'midjourney',
  'dalle3',
  'gpt-4o'
];

async function testModels() {
  console.log('🔍 Testing different models with KIE AI...\n');

  for (const model of MODELS_TO_TEST) {
    console.log(`🤖 Testing model: ${model}`);
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          input: {
            prompt: 'test image generation',
            image_urls: ['https://cdn.v-try.app/users/Ik6Jb9eZj52YLbZLI0ePV/face_zCE8QSyyVvMOn7BFHQai2.jpg'],
            output_format: 'png',
            image_size: 'auto'
          }
        })
      });

      const result = await response.json();
      console.log(`📊 Status: ${response.status}`);
      console.log(`📄 Response: ${JSON.stringify(result, null, 2)}`);
      
      if (result.code === 200) {
        console.log(`✅ SUCCESS! Model ${model} works!`);
        return model;
      } else if (result.code !== 401) {
        console.log(`🔍 Different error for ${model}: ${result.msg}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${model}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('❌ No working models found');
  return null;
}

testModels().catch(console.error);
