#!/usr/bin/env node

// Debug script to test KIE AI API directly
const API_KEY = process.env.KIE_AI_API_KEY || '206157340d3a4e4e8b3c9f5e7a8b2d1c'; // From Railway logs
const BASE_URL = 'https://api.kie.ai/api/v1';

// Test different possible endpoints
const ENDPOINTS_TO_TEST = [
  '/jobs/createTask',
  '/generate/image', 
  '/generate',
  '/task/create',
  '/image/generate'
];

async function testKIEAI() {
  console.log('🔑 Testing KIE AI with key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not found');
  
  try {
    // Step 1: Create a simple test task
    console.log('\n📝 Step 1: Creating KIE AI task...');
    
    const createResponse = await fetch(`${BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/nano-banana-edit',
        input: {
          prompt: 'Transform the person in the image to be wearing the clothing item shown in the product image. Make it look like a professional virtual try-on.',
          image_urls: [
            'https://cdn.v-try.app/users/Ik6Jb9eZj52YLbZLI0ePV/face_zCE8QSyyVvMOn7BFHQai2.jpg',
            'https://img01.ztat.net/article/spp-media-p1/8174f66d8e454c0badcfcfc3096d058c/4756b1fef39d4cc5b39934fa8ad7938e.jpg'
          ],
          output_format: 'png',
          image_size: 'auto'
        }
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ Create task failed:', createResponse.status, error);
      return;
    }

    const createResult = await createResponse.json();
    console.log('✅ Task created:', JSON.stringify(createResult, null, 2));
    
    if (createResult.code !== 200 || !createResult.data?.taskId) {
      console.error('❌ Invalid create response');
      return;
    }

    const taskId = createResult.data.taskId;
    console.log('🆔 Task ID:', taskId);

    // Step 2: Poll for status
    console.log('\n📊 Step 2: Polling for status...');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔄 Polling attempt ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await fetch(`${BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const error = await statusResponse.text();
        console.error('❌ Status check failed:', statusResponse.status, error);
        break;
      }

      const statusResult = await statusResponse.json();
      console.log('📊 Status result:', JSON.stringify(statusResult, null, 2));
      
      if (statusResult.code !== 200) {
        console.error('❌ Invalid status response');
        break;
      }

      const data = statusResult.data;
      const state = data.state;
      
      console.log('🏷️ Current state:', state);
      
      if (state === 'success') {
        console.log('✅ Task completed successfully!');
        
        // Parse resultJson
        if (data.resultJson) {
          try {
            const resultData = JSON.parse(data.resultJson);
            console.log('🖼️ Result data:', JSON.stringify(resultData, null, 2));
            
            if (resultData.resultUrls && resultData.resultUrls.length > 0) {
              console.log('🎯 Generated image URL:', resultData.resultUrls[0]);
              
              // Try to fetch the image to verify it exists
              console.log('\n🔍 Verifying generated image...');
              const imageResponse = await fetch(resultData.resultUrls[0]);
              console.log('📸 Image response status:', imageResponse.status);
              console.log('📸 Image content-type:', imageResponse.headers.get('content-type'));
              console.log('📸 Image content-length:', imageResponse.headers.get('content-length'));
              
            } else {
              console.warn('⚠️ No result URLs found in resultJson');
            }
          } catch (e) {
            console.error('❌ Failed to parse resultJson:', e.message);
            console.log('📄 Raw resultJson:', data.resultJson);
          }
        } else {
          console.warn('⚠️ No resultJson in response');
        }
        
        break;
      } else if (state === 'fail') {
        console.error('❌ Task failed:', data.failMsg);
        break;
      } else {
        console.log('⏳ Task still processing, waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    if (attempts >= maxAttempts) {
      console.warn('⚠️ Max polling attempts reached');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📄 Full error:', error);
  }
}

// Run the test
testKIEAI().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('❌ Test crashed:', error);
});
