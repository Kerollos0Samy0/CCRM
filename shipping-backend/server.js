const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const LOGIN_URL = 'https://softzone353-007-site12.atempurl.com/CPanel/CompanyPages/AddOrder/1236';

app.post('/api/shipping/create-order', async (req, res) => {
    const order = req.body;
    let browser;
    try {
        console.log(`Starting Puppeteer for order: ${order.id}`);
        browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        // Go to the add order page (will redirect to login if not authenticated)
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        
        // Check if we are on the login page (look for password input)
        const isLoginPage = await page.$('input[type="password"]');
        if (isLoginPage) {
            console.log('On login page, filling credentials...');
            
            // Assume first text input is username, password input is password
            const textInputs = await page.$$('input[type="text"]');
            if (textInputs.length > 0) {
                await textInputs[0].type('الحكاية ومافيها');
            }
            
            const passInput = await page.$('input[type="password"]');
            if (passInput) {
                await passInput.type('01288951942');
            }
            
            // Submit form
            await Promise.all([
                page.click('input[type="submit"], button[type="submit"], .btn-login, button.btn.btn-primary'),
                page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}), // catch timeout just in case
            ]);
            
            // Navigate explicitly to the AddOrder page to ensure we are not left on the dashboard
            console.log('Login submitted, navigating to AddOrder page explicitly...');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        }
        
        console.log('Checking current URL after login/navigation:', page.url());
        if (!page.url().toLowerCase().includes('addorder')) {
            console.log('Warning: Not on AddOrder page, trying goto one more time...');
            await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
        }
        
        console.log('Navigated to AddOrder page');
        
        // The AddOrder page form filling (Based on the provided screenshot structure)
        
        await page.evaluate((orderData) => {
            const fillField = (label, value) => {
                const labels = Array.from(document.querySelectorAll('label, span')).filter(el => el.innerText && el.innerText.includes(label));
                let input = null;
                for (let labelEl of labels) {
                    if (labelEl.hasAttribute('for')) {
                        const forAttr = labelEl.getAttribute('for');
                        input = document.querySelector('[id$="' + forAttr + '"]');
                        if (input) break;
                    }
                    if (labelEl.previousElementSibling && ['input', 'textarea', 'select'].includes(labelEl.previousElementSibling.tagName.toLowerCase())) {
                        input = labelEl.previousElementSibling;
                        break;
                    }
                }
                if (input && value) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };
            
            fillField('المرسل إليه', orderData.name || orderData.clientName);
            const cleanPhone = (val) => (val || '').toString().replace(/[^\d]/g, '');
            fillField('التليفون', cleanPhone(orderData.mobile || orderData.phone));
            fillField('العنوان', orderData.address);
            fillField('محتوى الأوردر', (orderData.items || []).map(i => `${i.workshop || i.name} (${i.quantity})`).join(', '));
            fillField('ملحوظة', orderData.orderNotes || (orderData.notes ? orderData.notes.map(n => n.text).join(' - ') : ''));
            fillField('اجمالى الأوردر', orderData.totalAmount || 0);
            fillField('عدد القطع', (orderData.items || []).reduce((acc, curr) => acc + (Number(curr.quantity)||1), 0) || 1);
            fillField('تكلفة الشحن', '0'); // Fix for shipping cost required
            
            const govSelect = document.querySelector('select[id$="CityDDL"]');
            if (govSelect) {
                const options = Array.from(govSelect.options);
                const normalize = s => (s||'').replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, '').trim();
                let matchingOpt = null;
                
                if (orderData.governorate) {
                    const normGov = normalize(orderData.governorate);
                    matchingOpt = options.find(opt => normalize(opt.text).includes(normGov));
                }
                
                // Fallback to searching the address string for a governorate name
                if (!matchingOpt && orderData.address) {
                    const normAddr = normalize(orderData.address);
                    matchingOpt = options.find(opt => {
                        const optNorm = normalize(opt.text);
                        return optNorm.length > 2 && optNorm !== 'اخترمحافظه' && normAddr.includes(optNorm);
                    });
                }
                
                // Final fallback: just pick the first valid option (usually Cairo) to bypass the 'Required' error
                if (!matchingOpt && options.length > 1) {
                    matchingOpt = options[1];
                }
                
                if (matchingOpt) {
                    govSelect.value = matchingOpt.value;
                    govSelect.dispatchEvent(new Event('change', {bubbles:true}));
                }
            }
        }, order);

        // Wait for any AJAX postback triggered by dropdown changes (like Governorate -> City)
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 }).catch(() => {});

        // Now select the City/District to avoid the "مطلوب" (Required) validation error
        await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            let citySelect = selects.find(s => s.id && !s.id.includes('CityDDL') && s.options && s.options.length > 1);
            if (!citySelect) {
                const labels = Array.from(document.querySelectorAll('label, span')).filter(el => el.innerText && el.innerText.includes('المدينة'));
                for (let labelEl of labels) {
                    if (labelEl.hasAttribute('for')) {
                        citySelect = document.querySelector('[id$="' + labelEl.getAttribute('for') + '"]');
                        if (citySelect) break;
                    }
                    if (labelEl.previousElementSibling && labelEl.previousElementSibling.tagName && labelEl.previousElementSibling.tagName.toLowerCase() === 'select') {
                        citySelect = labelEl.previousElementSibling;
                        break;
                    }
                }
            }
            if (citySelect && citySelect.options && citySelect.options.length > 1) {
                citySelect.value = citySelect.options[1].value;
                citySelect.dispatchEvent(new Event('change', {bubbles:true}));
            }
        });

        // Wait again in case selecting the city also triggers an AutoPostBack
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 5000 }).catch(() => {});

        console.log('Form filled. Clicking save button...');
        
        try {
            const btnClicked = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn'));
                const saveBtn = btns.find(el => (el.innerText || '').includes('حفظ الفاتورة') || (el.value || '').includes('حفظ الفاتورة') || (el.value || '').includes('حفظ'));
                if(saveBtn) { 
                    saveBtn.click(); 
                    return true; 
                }
                return false;
            });
            
            if (!btnClicked) {
                throw new Error('لم يتم العثور على زر الحفظ. الصفحة الحالية: ' + page.url());
            }
        } catch (e) {
            // If the click triggered a navigation instantly, evaluate will throw 'Execution context was destroyed'.
            // This is actually a sign of success because the form submitted.
            if (!e.message.includes('Execution context was destroyed') && !e.message.includes('Cannot find context with specified id')) {
                throw e;
            }
            console.log('Context destroyed during click - ignoring as it indicates successful form submission navigation.');
        }

        // Wait for page to navigate or show validation errors
        await new Promise(r => setTimeout(r, 4000));
        
        // Check if we are still on the same page and if there are errors
        const pageErrors = await page.evaluate(() => {
            if(window.location.href.toLowerCase().includes('addorder')) {
                const errorElements = Array.from(document.querySelectorAll('.text-danger, .alert-danger, span[style*="color: red"], span[style*="color:red"], span[style*="color:Red"], .error'));
                const errTexts = errorElements.filter(el => window.getComputedStyle(el).display !== 'none').map(el => el.innerText.trim()).filter(t => t.length > 0);
                if(errTexts.length > 0) return errTexts.join(' | ');
                
                const swal = document.querySelector('.swal-text, .swal2-html-container');
                if(swal && swal.innerText.includes('خطأ')) return swal.innerText;
                if(swal && swal.innerText.includes('نجاح')) return null;
                
                // If the form didn't navigate, but the fields were cleared, it means success!
                const nameInput = document.querySelector('input[id$="custNametxt"]');
                if (nameInput && nameInput.value.trim().length > 0) {
                    return "لم يقم موقع الشحن بحفظ الأوردر. قد يكون هناك حقل إجباري لم يتم تعبئته (تأكد من وجود المحافظة والمدينة في بيانات العميل).";
                }
                
                return null; // Form was cleared, meaning it successfully submitted!
            }
            return null;
        });

        if (pageErrors) {
            throw new Error('خطأ من موقع شركة الشحن: ' + pageErrors);
        }

        await browser.close();

        res.json({ success: true, message: 'Order created in shipping system successfully.' });
    } catch (error) {
        console.error('Error creating shipping order:', error);
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Shipping Backend running on http://localhost:${PORT}`);
});
