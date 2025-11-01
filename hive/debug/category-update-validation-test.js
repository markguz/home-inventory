#!/usr/bin/env node

/**
 * Category Update Validation Test
 * 
 * This script validates that the category update functionality works correctly
 * when using proper admin credentials.
 */

const baseUrl = 'http://localhost:3001';

async function validateCategoryUpdateFlow() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     CATEGORY UPDATE END-TO-END VALIDATION TEST           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================
    // STEP 1: Get CSRF Token
    // ========================================
    console.log('📋 STEP 1: Obtaining CSRF Token');
    console.log('─'.repeat(60));
    
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfCookie = csrfRes.headers.get('set-cookie');
    const csrfData = await csrfRes.json();
    
    if (!csrfData.csrfToken) {
      throw new Error('Failed to obtain CSRF token');
    }
    
    console.log('✅ CSRF token obtained successfully');
    console.log(`   Token: ${csrfData.csrfToken.substring(0, 20)}...`);
    console.log();

    // ========================================
    // STEP 2: Authenticate with Admin Credentials
    // ========================================
    console.log('🔐 STEP 2: Authenticating with Admin Credentials');
    console.log('─'.repeat(60));
    console.log('   Email: admin@homeinventory.local');
    console.log('   Password: admin123');
    
    const formData = new URLSearchParams();
    formData.append('email', 'admin@homeinventory.local');
    formData.append('password', 'admin123');
    formData.append('csrfToken', csrfData.csrfToken);
    formData.append('callbackUrl', `${baseUrl}/dashboard`);
    formData.append('json', 'true');
    
    const signinRes = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: csrfCookie,
      },
      body: formData.toString(),
      redirect: 'manual',
    });
    
    const signinLocation = signinRes.headers.get('location');
    const signinCookies = signinRes.headers.get('set-cookie');
    
    console.log(`   Response Status: ${signinRes.status}`);
    console.log(`   Redirect Location: ${signinLocation}`);
    
    if (!signinCookies || signinLocation?.includes('/signin')) {
      console.log('❌ Authentication FAILED');
      console.log('   This suggests either:');
      console.log('   - Wrong credentials');
      console.log('   - Database connection issue');
      console.log('   - NextAuth configuration problem');
      return false;
    }
    
    console.log('✅ Authentication successful');
    console.log();

    // Combine cookies
    const allCookies = [csrfCookie, signinCookies]
      .filter(Boolean)
      .flatMap(c => c.split(', '))
      .join('; ');

    // ========================================
    // STEP 3: Verify Session
    // ========================================
    console.log('🔍 STEP 3: Verifying Authentication Session');
    console.log('─'.repeat(60));
    
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Cookie: allCookies },
    });
    const sessionData = await sessionRes.json();
    
    if (!sessionData || !sessionData.user) {
      console.log('❌ Session verification FAILED');
      console.log(`   Session data: ${JSON.stringify(sessionData)}`);
      return false;
    }
    
    console.log('✅ Session verified successfully');
    console.log(`   User: ${sessionData.user.email}`);
    console.log(`   Role: ${sessionData.user.role}`);
    
    if (sessionData.user.role !== 'ADMIN') {
      console.log('⚠️  WARNING: User is not ADMIN - category updates will fail');
      return false;
    }
    console.log();

    // ========================================
    // STEP 4: Fetch Categories
    // ========================================
    console.log('📂 STEP 4: Fetching Categories List');
    console.log('─'.repeat(60));
    
    const categoriesRes = await fetch(`${baseUrl}/api/categories`, {
      headers: { Cookie: allCookies },
    });
    const categoriesData = await categoriesRes.json();
    
    if (!categoriesData.success || !categoriesData.data || categoriesData.data.length === 0) {
      console.log('❌ No categories found');
      console.log('   Cannot test category update without existing categories');
      return false;
    }
    
    console.log(`✅ Found ${categoriesData.data.length} categories`);
    console.log();

    // ========================================
    // STEP 5: Update Category
    // ========================================
    const testCategory = categoriesData.data[0];
    const timestamp = new Date().toISOString();
    
    console.log('📝 STEP 5: Updating Category');
    console.log('─'.repeat(60));
    console.log(`   Category ID: ${testCategory.id}`);
    console.log(`   Current Name: ${testCategory.name}`);
    console.log(`   Current Description: ${testCategory.description || '(none)'}`);
    console.log();
    
    const updatePayload = {
      name: testCategory.name,
      description: `Validation test update at ${timestamp}`,
      icon: testCategory.icon,
      color: testCategory.color,
      minQuantity: testCategory.minQuantity,
    };
    
    console.log('   Update Payload:');
    console.log(`   ${JSON.stringify(updatePayload, null, 2).split('\n').join('\n   ')}`);
    console.log();
    
    const updateRes = await fetch(`${baseUrl}/api/categories/${testCategory.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: allCookies,
      },
      body: JSON.stringify(updatePayload),
    });
    
    const updateData = await updateRes.json();
    
    console.log('   Response:');
    console.log(`   Status: ${updateRes.status} ${updateRes.statusText}`);
    console.log(`   ${JSON.stringify(updateData, null, 2).split('\n').join('\n   ')}`);
    console.log();

    // ========================================
    // RESULTS
    // ========================================
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST RESULTS                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    if (updateRes.ok && updateData.success) {
      console.log('✅ SUCCESS: Category update is working correctly!');
      console.log();
      console.log('   The category update functionality is FULLY OPERATIONAL.');
      console.log('   All authentication, authorization, and API calls are working.');
      console.log();
      console.log('   Updated category details:');
      console.log(`   - ID: ${updateData.data.id}`);
      console.log(`   - Name: ${updateData.data.name}`);
      console.log(`   - Description: ${updateData.data.description}`);
      console.log();
      return true;
    } else {
      console.log('❌ FAILURE: Category update failed');
      console.log();
      console.log(`   Status: ${updateRes.status}`);
      console.log(`   Error: ${updateData.error || 'Unknown error'}`);
      console.log();
      
      if (updateRes.status === 401) {
        console.log('   Diagnosis: Authentication issue');
      } else if (updateRes.status === 403) {
        console.log('   Diagnosis: Authorization issue (not ADMIN role)');
      } else if (updateRes.status === 400) {
        console.log('   Diagnosis: Validation error');
      } else {
        console.log('   Diagnosis: Server error');
      }
      console.log();
      return false;
    }
    
  } catch (error) {
    console.log('\n❌ TEST FAILED WITH ERROR:');
    console.log(`   ${error.message}`);
    console.log();
    console.log(error.stack);
    return false;
  }
}

// Run the validation
validateCategoryUpdateFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
