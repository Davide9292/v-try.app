#!/usr/bin/env node

// Simple KIE AI API test
const API_KEY = '206157340d3a4e4e8b3c9f5e7a8b2d1c';

async function testEndpoints() {
  const endpoints = [
    'https://api.kie.ai/api/v1/jobs/createTask',
    'https://api.kie.ai/api/v1/generate/image',
    'https://api.kie.ai/api/v1/generate',
    'https://api.kie.ai/v1/jobs/createTask',
    'https://api.kie.ai/v1/generate/image'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/nano-banana-edit',
          input: {
            prompt: 'test prompt',
            image_urls: ['https://example.com/test.jpg'],
            output_format: 'png'
          }
        })
      });

      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log(`📄 Response: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
      
      if (response.status !== 404) {
        console.log('✅ Found working endpoint!');
        break;
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

testEndpoints().catch(console.error);
