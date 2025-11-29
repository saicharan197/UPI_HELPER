/* app.js — Full app logic (translations + UPI PIN + pages + QR + txs)
   Updated: Auto voice playback immediately after UPI payment completes.
   No other feature changes from your existing app.
*/

(() => {
  const FORCE_NEW_ONLOAD = true; // preserve your current testing behavior

  // --- Page elements ---
  const pages = {
    phone: document.getElementById('pagePhone'),
    otp: document.getElementById('pageOtp'),
    bank: document.getElementById('pageBank'),
    home: document.getElementById('pageHome'),
    history: document.getElementById('pageHistory'),
    settings: document.getElementById('pageSettings'),
  };

  // Onboarding controls
  const phoneInput = document.getElementById('phone');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const backFromPhone = document.getElementById('backFromPhone');

  const otpInput = document.getElementById('otp');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const backFromOtp = document.getElementById('backFromOtp');

  const bankSelect = document.getElementById('bankSelect');
  const verifyBankBtn = document.getElementById('verifyBankBtn');
  const upiInput = document.getElementById('upi');
  const govIdInput = document.getElementById('govId');
  const backFromPost = document.getElementById('backFromPost');
  const finishSetupBtn = document.getElementById('finishSetupBtn');

  // Home / Header / Profile
  const storeTitle = document.getElementById('storeTitle');
  const bankInfo = document.getElementById('bankInfo');
  const profileBtn = document.getElementById('profileBtn');

  // Page open buttons
  const btnOpenHome = document.getElementById('btnOpenHome');
  const btnOpenHistory = document.getElementById('btnOpenHistory');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const backFromHistory = document.getElementById('backFromHistory');
  const backFromSettings = document.getElementById('backFromSettings');

  // History internals
  const btnBankStatements = document.getElementById('btnBankStatements');
  const btnBankBalance = document.getElementById('btnBankBalance');
  const bankProtectedContent = document.getElementById('bankProtectedContent');

  // Settings internals
  const storeNameInput = document.getElementById('storeName');
  const merchantVpaInput = document.getElementById('merchantVpa');
  const langSelect = document.getElementById('langSelect');
  const langSelect2 = document.getElementById('langSelect2');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');

  // UPI PIN modals
  const setUpiPinModal = document.getElementById('setUpiPinModal');
  const setUpiPinInput = document.getElementById('setUpiPinInput');
  const setUpiPinBtn = document.getElementById('setUpiPinBtn');
  const skipUpiPinBtn = document.getElementById('skipUpiPinBtn');

  const enterUpiPinModal = document.getElementById('enterUpiPinModal');
  const enterUpiPinInput = document.getElementById('enterUpiPinInput');
  const verifyUpiPinBtn = document.getElementById('verifyUpiPinBtn');
  const cancelUpiPinBtn = document.getElementById('cancelUpiPinBtn');

  // Transactions + modals
  const txList = document.getElementById('txList');
  const recentBody = document.getElementById('recentBody');

  const modalContainer = document.getElementById('modalContainer');
  const amountText = document.getElementById('amountText');
  const pad = document.getElementById('pad');
  const confirmAmountBtn = document.getElementById('confirmAmountBtn');
  const cancelAmountBtn = document.getElementById('cancelAmountBtn');

  const qrModal = document.getElementById('qrModal');
  const qrcodeEl = document.getElementById('qrcode');
  const payerNameInput = document.getElementById('payerName');
  const simulatePaymentBtn = document.getElementById('simulatePaymentBtn');
  const closeQrBtn = document.getElementById('closeQrBtn');

  const txDetailModal = document.getElementById('txDetailModal');
  const txDetailBody = document.getElementById('txDetailBody');
  const closeTxDetailBtn = document.getElementById('closeTxDetailBtn');

  // Profile modal
  const profileModal = document.getElementById('profileModal');
  const profileBody = document.getElementById('profileBody');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const closeProfileBtn = document.getElementById('closeProfileBtn');

  // demo bank-phone linkage (unchanged)
  const bankLinked = {
    '9876543210': 'State Bank of India',
    '9998887776': 'HDFC Bank',
    '8887776665': 'ICICI Bank',
    '7776665554': 'Axis Bank'
  };

  // state
  let navStack = [];
  let generatedOtp = '';
  let txs = JSON.parse(localStorage.getItem('txs') || '[]');
  let user = JSON.parse(localStorage.getItem('user') || '{}');
  let lang = localStorage.getItem('lang') || 'en';
  let currentAmount = 0;

  // translations (Option A as you requested; covers all UI + alerts)
  const STR = {
    en: {
      hdrPhone: 'Enter Phone', mutedPhone: 'Enter shop / owner phone number (10 digits).', lblPhone: 'Phone number',
      sendOtp: 'Send OTP', hdrOtp: 'Verify OTP', mutedOtp: 'We simulated sending an OTP to the phone. Enter it below.',
      lblOtp: 'OTP', verify: 'Verify', resend: 'Resend', hdrBank: 'Bank & KYC',
      mutedBank: 'Select bank, enter UPI and Govt ID (Aadhaar / PAN).', lblBank: 'Select bank', verifyBank: 'Verify Bank',
      lblUpi: 'UPI / Collection ID', lblGov: 'Govt ID (Aadhaar / PAN)', finish: 'Finish & Go to Home', back: 'Back',
      home: 'Home', history: 'History', settings: 'Settings', newPayment: 'New Payment', logPayment: 'Log Payment', recent: 'Recent',
      bankStatements: 'Bank Statements', bankBalance: 'Bank Balance',
      setUpiTitle: 'Set UPI PIN', setUpiMuted: 'Create a 4-digit UPI PIN to protect bank info.', setPin: 'Set PIN', skip: 'Skip',
      enterUpiTitle: 'Enter UPI PIN', enterUpiMuted: 'Enter your 4-digit UPI PIN to continue.', verifyPin: 'Verify', cancel: 'Cancel',
      profile: 'Profile', edit: 'Edit', close: 'Close', storeName: 'Store name', merchantVpa: 'Merchant VPA (UPI address)',
      language: 'Language', export: 'Export', clearData: 'Clear Data', enterAmount: 'Enter amount', generateQr: 'Generate QR',
      add: 'ADD', cancelBtn: 'Cancel', showQr: 'Show QR to customer', simulatePayment: 'Simulate Payment', txDetails: 'Transaction details',
      otpSent: 'OTP sent (simulated): ', invalidOtp: 'Invalid OTP', enterValidPhone: 'Enter valid 10-digit phone',
      phoneNotRegistered: 'Phone not registered with selected bank (simulated).', enterUpi: 'Choose bank and enter UPI',
      merchantVpaMissing: 'Please set a valid Merchant VPA (like merchant@bank) in Settings before generating UPI QR.',
      enterAmountAlert: 'Enter an amount', pinSetOk: 'UPI PIN set. Now click the Bank Statements / Bank Balance button again.',
      wrongPin: 'Wrong PIN', cashLogged: 'Cash logged', paymentSimulated: 'Payment simulated', noTx: 'No transactions yet',
      noRecent: 'No recent transactions'
    },
    kn: {
      hdrPhone: 'ದೂರವಾಣಿ ನಮೂದಿಸಿ', mutedPhone: 'ದೂಕಾಣ / ಮಾಲಿಕರ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ (10 ಅಂಕಿಗಳು).', lblPhone: 'ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
      sendOtp: 'OTP ಕಳುಹಿಸಿ', hdrOtp: 'OTP ಪರಿಶೀಲಿಸಿ', mutedOtp: 'OTP ಸಿಮ್ಯುಲೇಟೆಡ್ ಆಗಿ ಕಳುಹಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಅದನ್ನು ನಮೂದಿಸಿ.',
      lblOtp: 'OTP', verify: 'ಪರಿಶೀಲಿಸಿ', resend: 'ಮತ್ತೆ ಕಳುಹಿಸಿ', hdrBank: 'ಬ್ಯಾಂಕ್ ಮತ್ತು KYC',
      mutedBank: 'ಬ್ಯಾಂಕ್ ಆಯ್ಕೆ ಮಾಡಿ, UPI ಮತ್ತು ಸರ್ಕಾರಿ ID (ಆಧಾರ್ / PAN) ನಮૂದಿಸಿ.', lblBank: 'ಬ್ಯಾಂಕ್ ಆಯ್ಕೆಮಾಡಿ', verifyBank: 'ಬ್ಯಾಂಕ್ ಪರಿಶೀಲಿಸಿ',
      lblUpi: 'UPI / ಕಲೆಕ್ಷನ್ ID', lblGov: 'ಸರ್ಕಾರಿ ID (ಆಧಾರ್ / PAN)', finish: 'ಮುಗಿಸಿ & ಮನೆಗೆ ಹೋಗಿ', back: 'ಹಿಂದೆ',
      home: 'ಮೂಕಪುಟ', history: 'ಇತಿಹಾಸ', settings: 'ಸೆಟ್ಟಿಂಗ್ಗಳು', newPayment: 'ಹೊಸ ಪಾವತಿ', logPayment: 'ಕ್ಯಾಶ್ ಲಾಗ್', recent: 'ಇತ್ತೀಚಿನ',
      bankStatements: 'ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್ಮೆಂಟ್ಸ್', bankBalance: 'ಬ್ಯಾಂಕ್ ಶೇಷ',
      setUpiTitle: 'UPI PIN ಹೊಂದಿಸಿ', setUpiMuted: 'ಬ್ಯಾಂಕ್ ಮಾಹಿತಿಯನ್ನು ರಕ್ಷಿಸಲು 4 ಅಂಕಿಯ UPI PIN ರಚಿಸಿ.', setPin: 'PIN ಹೊಂದಿಸಿ', skip: 'ಬಿಟ್ಟಿಟ್ಟಿ',
      enterUpiTitle: 'UPI PIN ನಮೂದಿಸಿ', enterUpiMuted: 'ಮುಂದುವರಿಸಲು 4 ಅಂಕಿಯ UPI PIN ನಮೂದಿಸಿ.', verifyPin: 'ಪರಿಶೀಲಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ',
      profile: 'ಪ್ರೊಫೈಲ್', edit: 'ಸಂಪಾದನೆ', close: 'ಮುಚ್ಚಿ', storeName: 'ಅಂಗಡಿ ಹೆಸರು', merchantVpa: 'ಮರ್ಚಂಟ್ VPA (UPI ವಿಳಾಸ)',
      language: 'ಭಾಷೆ', export: 'ಎಕ್ಸ್ಪೋರ್ಟ್', clearData: 'ಡೇಟಾ ತೆರವು', enterAmount: 'ರೊಳವನ್ನು ನಮೂದಿಸಿ', generateQr: 'QR ರಚಿಸಿ',
      add: 'ಹೆಚ್ಚಿಸಿ', cancelBtn: 'ರದ್ದುಮಾಡಿ', showQr: 'ಗ್ರಾಹಕ에게 QR ತೋರಿಸಿ', simulatePayment: ' ಪಾವತಿ ಸಿಮ್ಯುಲೇಷನ್', txDetails: 'ವಹಿವಾಟಿನ ವಿವರಗಳು',
      otpSent: 'OTP ಕಳುಹಿಸಲಾಗಿದೆ (ಸಿಮ್ಯುಲೇಟೆಡ್): ', invalidOtp: 'ಅಮಾನ್ಯ OTP', enterValidPhone: ' ದಯವಿಟ್ಟು 10 ಅಂಕಿಯ ಫೋನ್ ಅನ್ನು ನಮೂದಿಸಿ',
      phoneNotRegistered: 'ಆ ಫೋನ್ ಸಂಖ್ಯೆ ಆರಿಸಿದ ಬ್ಯಾಂಕ್‌ಗೆ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ (ಸಿಮ್ಯುಲೇಟೆಡ್).', enterUpi: 'ಬ್ಯಾಂಕ್ ಮತ್ತು UPI ಅನ್ನು ಆರಿಸಿ ಮತ್ತು ನಮೂದಿಸಿ',
      merchantVpaMissing: 'UPI Merchant VPA ಅನ್ನು ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಸೆಟ್ ಮಾಡಿ (ಉದಾಹರಣೆಗೆ merchant@bank).', enterAmountAlert: 'ದಯವಿಟ್ಟು ರಾಶಿ ನಮೂದಿಸಿ',
      pinSetOk: 'UPI PIN ಹೊಂದಿಸಲಾಗಿದೆ. ಈಗ ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್ಮೆಂಟ್ಸ್ / ಬ್ಯಾಂಕ್ ಬ್ಯಾಲೆನ್ಸ್ ಕ್ಲಿಕ್ ಮಾಡಿ.', wrongPin: 'ತಪ್ಪು PIN',
      cashLogged: 'ನಗದು ದಾಖಲಿಸಲಾಗಿದೆ', paymentSimulated: 'ಪಾವತಿ ಸಿಮ್ಯುಲೇಟೆಡ್', noTx: 'ಯಾವುದೇ ವ್ಯವಹಾರಗಳಿಲ್ಲ', noRecent: 'ಯಾವುದೇ ಇತ್ತೀಚಿನ ವ್ಯವಹಾರಗಳಿಲ್ಲ'
    },
    hi: {
      hdrPhone: 'फोन दर्ज करें', mutedPhone: 'दुकान / मालिक का फ़ोन नंबर दर्ज करें (10 अंक).', lblPhone: 'फ़ोन नंबर',
      sendOtp: 'OTP भेजें', hdrOtp: 'OTP सत्यापित करें', mutedOtp: 'OTP सिम्युलेटेड रूप से भेजा गया है। कृपया इसे दर्ज करें।',
      lblOtp: 'OTP', verify: 'सत्यापित करें', resend: 'फिर से भेजें', hdrBank: 'बैंक और KYC',
      mutedBank: 'बैंक चुनें, UPI और सरकारी ID दर्ज करें (आधार / PAN).', lblBank: 'बैंक चुनें', verifyBank: 'बैंक सत्यापित करें',
      lblUpi: 'UPI / कलेक्शन ID', lblGov: 'सरकारी ID (आधार / PAN)', finish: 'समाप्त करें और होम पर जाएं', back: 'वापस',
      home: 'होम', history: 'इतिहास', settings: 'सेटिंग्स', newPayment: 'नया भुगतान', logPayment: 'कैश लॉग', recent: 'हाल का',
      bankStatements: 'बैंक स्टेटमेंट्स', bankBalance: 'बैंक बैलेंस',
      setUpiTitle: 'UPI PIN सेट करें', setUpiMuted: 'बैंक जानकारी की सुरक्षा के लिए 4-अंकीय UPI PIN बनाएं।', setPin: 'PIN सेट करें', skip: 'स्किप करें',
      enterUpiTitle: 'UPI PIN दर्ज करें', enterUpiMuted: 'जारी रखने के लिए अपना 4-अंकीय UPI PIN दर्ज करें।', verifyPin: 'सत्यापित करें', cancel: 'रद्द करें',
      profile: 'प्रोफ़ाइल', edit: 'संपादित', close: 'बंद करें', storeName: 'स्टोर का नाम', merchantVpa: 'मर्चेंट VPA (UPI पता)',
      language: 'भाषा', export: 'निर्यात', clearData: 'डेटा साफ़ करें', enterAmount: 'राशि दर्ज करें', generateQr: 'QR जनरेट करें',
      add: 'जोड़ें', cancelBtn: 'रद्द करें', showQr: 'ग्राहक को QR दिखाएँ', simulatePayment: 'भुगतान सिम्युलेट करें', txDetails: 'लेनदेन विवरण',
      otpSent: 'OTP भेजा गया (सिम्युलेटेड): ', invalidOtp: 'अमान्य OTP', enterValidPhone: 'कृपया 10-अंकीय फ़ोन दर्ज करें',
      phoneNotRegistered: 'चयनित बैंक में फोन पंजीकृत नहीं है (सिम्युलेटेड).', enterUpi: 'बैंक चुनें और UPI दर्ज करें',
      merchantVpaMissing: 'कृपया सेटिंग्स में वैध Merchant VPA सेट करें (जैसे merchant@bank).', enterAmountAlert: 'कृपया राशि दर्ज करें',
      pinSetOk: 'UPI PIN सेट किया गया है। अब बैंक स्टेटमेंट / बैंक बैलेंस पर क्लिक करें।', wrongPin: 'गलत PIN', cashLogged: 'कैश लॉग किया गया',
      paymentSimulated: 'भुगतान सिम्युलेट किया गया', noTx: 'कोई लेनदेन नहीं', noRecent: 'कोई हालिया लेनदेन नहीं'
    },
    te: {
      hdrPhone: 'ఫోన్ నమోదు చేయండి', mutedPhone: 'దుకాణం/మాలిక ఫోన్ నంబర్ నమోదు చేయండి (10 అంకెలు).', lblPhone: 'ఫోన్ నంబర్',
      sendOtp: 'OTP పంపండి', hdrOtp: 'OTP ధృవీకరించండి', mutedOtp: 'OTP సిమ్యులేటెడ్‌గా పంపబడింది. దయచేసి నమోదు చేయండి.',
      lblOtp: 'OTP', verify: 'ధృవీకరించండి', resend: 'మళ్ళీ పంపండి', hdrBank: 'బ్యాంక్ & KYC',
      mutedBank: 'బ్యాంక్ ఎంచుకోండి, UPI మరియు ప్రభుత్వ ID నమోదు చేయండి (ఆధార్ / PAN).', lblBank: 'బ్యాంక్ ఎంచుకోండి', verifyBank: 'బ్యాంక్ ధృవీకరించండి',
      lblUpi: 'UPI / కలెక్షన్ ID', lblGov: 'ప్రభుత్వ ID (ఆధార్ / PAN)', finish: 'పూర్తి చేసి హోమ్‌కు వెళ్లండి', back: 'వెనక్కి',
      home: 'హోమ్', history: 'చరిత్ర', settings: 'సెట్టింగ్స్', newPayment: 'కొత్త చెల్లింపు', logPayment: 'నగదు నమోదు', recent: 'ఇటీవల',
      bankStatements: 'బ్యాంక్ స్టేట్మెంట్లు', bankBalance: 'బ్యాంక్ బ్యాలెన్స్',
      setUpiTitle: 'UPI PIN సెట్ చేయండి', setUpiMuted: 'బ్యాంక్ సమాచారం రక్షించడానికి 4-అంకెల UPI PIN సృష్టించండి.', setPin: 'PIN సెట్ చేయండి', skip: 'వదిలేయి',
      enterUpiTitle: 'UPI PIN నమోదు చేయండి', enterUpiMuted: 'కొనసాగేందుకు మీ 4-అంకెల UPI PIN నమోదు చేయండి.', verifyPin: 'ధృవీకరించండి', cancel: 'రద్దు',
      profile: 'ప్రొఫైల్', edit: 'సవరించు', close: 'మూసేయి', storeName: 'స్టోర్ పేరు', merchantVpa: 'మర్చంట్ VPA (UPI చిరునామా)',
      language: 'భాష', export: 'ఎగుమతి', clearData: 'డేటాను క్లియర్ చేయండి', enterAmount: 'మొత్తం నమోదు చేయండి', generateQr: 'QR రూపొందించండి',
      add: 'జోడించు', cancelBtn: 'రద్దు', showQr: 'ఖాతాదారుకు QR చూపించండి', simulatePayment: 'చెల్లింపును సిమ్యులేట్ చేయండి', txDetails: 'లావాదేవీ వివరణలు',
      otpSent: 'OTP పంపబడింది (సిమ్యులేటెడ్): ', invalidOtp: 'చెల్లించని OTP', enterValidPhone: 'దయచేసి 10 అంకెల ఫోన్ నమోదు చేయండి',
      phoneNotRegistered: 'ఎంచుకున్న బ్యాంకులో ఫోన్ రిజిస్టర్డ్ కాదు (సిమ్యులేటెడ్).', enterUpi: 'బ్యాంక్ ఎంచుకుని UPI నమోదు చేయండి',
      merchantVpaMissing: 'దయచేసి సెట్టింగ్స్‌లో సరైన Merchant VPA సెటప్ చేయండి (ఉదా: merchant@bank).', enterAmountAlert: 'దయచేసి మొత్తం నమోదు చేయండి',
      pinSetOk: 'UPI PIN సెటైంది. ఇప్పుడు బ్యాంక్ స్టేట్మెంట్స్ / బ్యాంక్ బ్యాలెన్స్ క్లిక్ చేయండి.', wrongPin: 'తప్పు PIN', cashLogged: 'నగదు లాగ్ చేయబడింది',
      paymentSimulated: 'చెల్లింపు సిమ్యులేటెడ్', noTx: 'ఎలాంటి లావాదేవీలు లేవు', noRecent: 'ఎలాంటి రీసెంట్ లావాదేవీలు లేవు'
    }
  };

  // helper to fetch translation
  function t(key) {
    return (STR[lang] && STR[lang][key]) || STR['en'][key] || key;
  }

  // apply translations across UI
  function applyLangAll() {
    // Onboarding small texts
    const mutedPhone = document.getElementById('mutedPhone');
    const mutedOtp = document.getElementById('mutedOtp');
    const mutedBank = document.getElementById('mutedBank');
    if (mutedPhone) mutedPhone.textContent = t('mutedPhone');
    if (mutedOtp) mutedOtp.textContent = t('mutedOtp');
    if (mutedBank) mutedBank.textContent = t('mutedBank');

    // Headings
    const hdrPhone = document.getElementById('hdrPhone');
    const hdrOtp = document.getElementById('hdrOtp');
    const hdrBank = document.getElementById('hdrBank');
    if (hdrPhone) hdrPhone.textContent = t('hdrPhone');
    if (hdrOtp) hdrOtp.textContent = t('hdrOtp');
    if (hdrBank) hdrBank.textContent = t('hdrBank');

    // Labels
    const lblPhone = document.getElementById('lblPhone');
    const lblOtp = document.getElementById('lblOtp');
    const lblBank = document.getElementById('lblBank');
    const lblUpi = document.getElementById('lblUpi');
    const lblGov = document.getElementById('lblGov');
    const lblStore = document.getElementById('lblStore');
    const lblMerchantVpa = document.getElementById('lblMerchantVpa');
    if (lblPhone) lblPhone.textContent = t('lblPhone');
    if (lblOtp) lblOtp.textContent = t('lblOtp');
    if (lblBank) lblBank.textContent = t('lblBank');
    if (lblUpi) lblUpi.textContent = t('lblUpi');
    if (lblGov) lblGov.textContent = t('lblGov');
    if (lblStore) lblStore.textContent = t('storeName');
    if (lblMerchantVpa) lblMerchantVpa.textContent = t('merchantVpa');

    // Buttons
    if (sendOtpBtn) sendOtpBtn.textContent = t('sendOtp');
    if (verifyOtpBtn) verifyOtpBtn.textContent = t('verify');
    if (resendOtpBtn) resendOtpBtn.textContent = t('resend');
    if (finishSetupBtn) finishSetupBtn.textContent = t('finish');
    if (backFromPhone) backFromPhone.textContent = t('back');
    if (backFromOtp) backFromOtp.textContent = '← ' + t('back');
    if (backFromPost) backFromPost.textContent = '← ' + t('back');
    if (backFromHistory) backFromHistory.textContent = t('back');
    if (backFromSettings) backFromSettings.textContent = t('back');

    // Home tiles
    const newPaymentBtn = document.getElementById('newPaymentBtn');
    const logPaymentBtn = document.getElementById('logPaymentBtn');
    const recentCardTitle = document.querySelector('#recentCard .tile-title');
    if (newPaymentBtn) newPaymentBtn.textContent = t('enterAmount');
    if (logPaymentBtn) logPaymentBtn.textContent = t('logPayment');
    if (recentCardTitle) recentCardTitle.textContent = t('recent');

    // History medium tabs
    if (btnBankStatements) btnBankStatements.textContent = t('bankStatements');
    if (btnBankBalance) btnBankBalance.textContent = t('bankBalance');

    // UPI PIN modals
    const setUpiPinTitle = document.getElementById('setUpiPinTitle');
    const setUpiPinMuted = document.getElementById('setUpiPinMuted');
    const enterUpiPinTitle = document.getElementById('enterUpiPinTitle');
    const enterUpiPinMuted = document.getElementById('enterUpiPinMuted');
    if (setUpiPinTitle) setUpiPinTitle.textContent = t('setUpiTitle');
    if (setUpiPinMuted) setUpiPinMuted.textContent = t('setUpiMuted');
    if (enterUpiPinTitle) enterUpiPinTitle.textContent = t('enterUpiTitle');
    if (enterUpiPinMuted) enterUpiPinMuted.textContent = t('enterUpiMuted');
    if (setUpiPinBtn) setUpiPinBtn.textContent = t('setPin');
    if (skipUpiPinBtn) skipUpiPinBtn.textContent = t('skip');
    if (verifyUpiPinBtn) verifyUpiPinBtn.textContent = t('verifyPin');
    if (cancelUpiPinBtn) cancelUpiPinBtn.textContent = t('cancel');

    // Profile & Settings
    const hdrProfile = document.getElementById('hdrProfile');
    if (hdrProfile) hdrProfile.textContent = t('profile');
    if (editProfileBtn) editProfileBtn.textContent = t('edit');
    if (closeProfileBtn) closeProfileBtn.textContent = t('close');
    if (storeNameInput) storeNameInput.placeholder = storeNameInput.placeholder || '';
    if (langSelect2) langSelect2.value = lang;

    // Amount modal + QR
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = t('enterAmount');
    if (confirmAmountBtn) confirmAmountBtn.textContent = t('generateQr');
    if (cancelAmountBtn) cancelAmountBtn.textContent = t('cancelBtn');
    const qrTitle = document.getElementById('qrTitle');
    if (qrTitle) qrTitle.textContent = t('showQr');
    if (simulatePaymentBtn) simulatePaymentBtn.textContent = t('simulatePayment');

    // tx detail header
    const txHdr = document.querySelector('#txDetailModal h3');
    if (txHdr) txHdr.textContent = t('txDetails');

    // update dynamic UI pieces
    updateRecent();
    renderTxList();
  }

  // Language selectors wiring
  if (langSelect) { langSelect.value = lang; langSelect.onchange = () => { lang = langSelect.value; localStorage.setItem('lang', lang); applyLangAll(); }; }
  if (langSelect2) { langSelect2.value = lang; langSelect2.onchange = () => { lang = langSelect2.value; localStorage.setItem('lang', lang); if (langSelect) langSelect.value = lang; applyLangAll(); }; }

  // show translated alerts (key from STR or raw text)
  function showAlert(keyOrText) {
    const maybe = (STR[lang] && STR[lang][keyOrText]) ? STR[lang][keyOrText] : (STR['en'][keyOrText] ? STR['en'][keyOrText] : keyOrText);
    alert(maybe);
  }

  // Navigation helpers
  function showPage(id, push = true) {
    Object.values(pages).forEach(p => p.classList.remove('active-page'));
    if (pages[id]) pages[id].classList.add('active-page');
    if (push) {
      const top = navStack[navStack.length - 1];
      if (top !== id) navStack.push(id);
    }
  }
  function goBack() {
    navStack.pop(); const prev = navStack.pop();
    if (!prev) { navStack = ['phone']; showPage('phone', false); return; }
    showPage(prev, false);
  }

  // Wire back buttons
  backFromPhone && backFromPhone.addEventListener('click', goBack);
  backFromOtp && backFromOtp.addEventListener('click', goBack);
  backFromPost && backFromPost.addEventListener('click', goBack);
  backFromHistory && backFromHistory.addEventListener('click', () => showPage('home'));
  backFromSettings && backFromSettings.addEventListener('click', () => showPage('home'));

  // Onboarding flow
  sendOtpBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    if (!/^\d{10}$/.test(phone)) { showAlert('enterValidPhone'); return; }
    generatedOtp = (Math.floor(Math.random() * 9000) + 1000).toString();
    // show translated prefix then OTP
    alert(t('otpSent') + generatedOtp);
    showPage('otp');
    setTimeout(() => { otpInput.focus(); }, 50);
  });

  resendOtpBtn && resendOtpBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim(); if (!/^\d{10}$/.test(phone)) { showAlert('enterValidPhone'); showPage('phone'); return; }
    generatedOtp = (Math.floor(Math.random() * 9000) + 1000).toString();
    alert(t('otpSent') + generatedOtp);
    setTimeout(() => { otpInput.focus(); }, 50);
  });

  verifyOtpBtn.addEventListener('click', () => {
    if (otpInput.value.trim() === generatedOtp) { showPage('bank'); setTimeout(()=>upiInput.focus(), 50); }
    else { showAlert('invalidOtp'); otpInput.focus(); }
  });

  verifyBankBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim(); const chosen = bankSelect.value;
    if (!phone || !chosen) { showAlert('enterUpi'); return; }
    const linked = bankLinked[phone];
    if (linked && linked === chosen) { alert(chosen + ' — ' + t('verifyBank')); } else showAlert('phoneNotRegistered');
  });

  finishSetupBtn.addEventListener('click', () => {
    const phone = phoneInput.value.trim(); const chosen = bankSelect.value; const upi = upiInput.value.trim();
    if (!/^\d{10}$/.test(phone)) { showAlert('enterValidPhone'); showPage('phone'); return; }
    if (!chosen || !upi) { showAlert('enterUpi'); return; }
    user = { phone, bank: chosen, upi, govId: govIdInput.value.trim() };
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('lang', lang);
    showPage('home');
    populateUserUI();
  });

  // Profile modal
  profileBtn.addEventListener('click', () => openProfile(false));
  closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));

  function openProfile(edit) {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (!u.phone) { profileBody.innerHTML = `<div class="muted">${t('noTx') || 'No profile found'}</div>`; profileModal.classList.remove('hidden'); return; }
    if (!edit) {
      profileBody.innerHTML = `<div><strong>${t('lblPhone') || 'Phone'}:</strong> ${u.phone}</div>
        <div><strong>${t('lblBank') || 'Bank'}:</strong> ${u.bank}</div>
        <div><strong>${t('lblUpi') || 'UPI'}:</strong> ${u.upi}</div>
        <div><strong>${t('lblGov') || 'Govt ID'}:</strong> ${u.govId || '--'}</div>`;
      editProfileBtn.textContent = t('edit'); editProfileBtn.onclick = () => openProfile(true);
    } else {
      profileBody.innerHTML = `<label>${t('lblPhone') || 'Phone'}</label><input id="pfPhone" value="${u.phone}" />
        <label>${t('lblBank') || 'Bank'}</label><input id="pfBank" value="${u.bank}" />
        <label>${t('lblUpi') || 'UPI'}</label><input id="pfUpi" value="${u.upi}" />
        <label>${t('lblGov') || 'Govt ID'}</label><input id="pfGov" value="${u.govId || ''}" />`;
      editProfileBtn.textContent = t('edit');
      editProfileBtn.onclick = () => {
        const pfPhone = document.getElementById('pfPhone').value.trim();
        const pfBank = document.getElementById('pfBank').value.trim();
        const pfUpi = document.getElementById('pfUpi').value.trim();
        const pfGov = document.getElementById('pfGov').value.trim();
        if (!/^\d{10}$/.test(pfPhone)) { showAlert('enterValidPhone'); return; }
        user = { phone: pfPhone, bank: pfBank, upi: pfUpi, govId: pfGov };
        localStorage.setItem('user', JSON.stringify(user));
        populateUserUI(); profileModal.classList.add('hidden');
      };
    }
    profileModal.classList.remove('hidden');
  }

  // Page open buttons
  btnOpenHome && btnOpenHome.addEventListener('click', () => showPage('home'));
  btnOpenHistory && btnOpenHistory.addEventListener('click', () => showPage('history'));
  btnOpenSettings && btnOpenSettings.addEventListener('click', () => showPage('settings'));
  backFromHistory && backFromHistory.addEventListener('click', () => showPage('home'));
  backFromSettings && backFromSettings.addEventListener('click', () => showPage('home'));

  // Bank-protected content (History)
  function requestUpiPin(action) {
    const stored = localStorage.getItem('upiPin');
    enterUpiPinModal.dataset.request = action;
    if (!stored) {
      setUpiPinModal.classList.remove('hidden');
      setUpiPinInput.value = '';
      setUpiPinInput.focus();
    } else {
      enterUpiPinModal.classList.remove('hidden');
      enterUpiPinInput.value = '';
      enterUpiPinInput.focus();
    }
  }

  setUpiPinBtn && setUpiPinBtn.addEventListener('click', () => {
    const p = setUpiPinInput.value.trim();
    if (!p || p.length !== 4 || !/^\d{4}$/.test(p)) { alert('Enter 4-digit PIN'); return; }
    localStorage.setItem('upiPin', p);
    setUpiPinModal.classList.add('hidden');
    showAlert('pinSetOk');
  });
  skipUpiPinBtn && skipUpiPinBtn.addEventListener('click', () => setUpiPinModal.classList.add('hidden'));

  verifyUpiPinBtn && verifyUpiPinBtn.addEventListener('click', () => {
    const stored = localStorage.getItem('upiPin');
    const entered = enterUpiPinInput.value.trim();
    const action = enterUpiPinModal.dataset.request;
    if (!stored) { enterUpiPinModal.classList.add('hidden'); setUpiPinModal.classList.remove('hidden'); return; }
    if (entered === stored) {
      enterUpiPinModal.classList.add('hidden');
      if (action === 'statements') showBankStatements();
      else if (action === 'balance') showBankBalance();
    } else { showAlert('wrongPin'); enterUpiPinInput.value = ''; enterUpiPinInput.focus(); }
  });
  cancelUpiPinBtn && cancelUpiPinBtn.addEventListener('click', () => enterUpiPinModal.classList.add('hidden'));

  btnBankStatements && btnBankStatements.addEventListener('click', () => requestUpiPin('statements'));
  btnBankBalance && btnBankBalance.addEventListener('click', () => requestUpiPin('balance'));

  function showBankStatements() {
    bankProtectedContent.classList.remove('hidden');
    const sample = [
      { date: '2025-11-25', desc: 'Credit - UPI', amt: 250.00 },
      { date: '2025-11-24', desc: 'Debit - POS', amt: -120.00 },
      { date: '2025-11-22', desc: 'Credit - NEFT', amt: 500.00 }
    ];
    let html = `<h4>${t('bankStatements')}</h4><ul>`;
    sample.forEach(s => { html += `<li>${s.date} • ${s.desc} • ₹${s.amt.toFixed(2)}</li>`; });
    html += '</ul>';
    bankProtectedContent.innerHTML = html;
  }

  function showBankBalance() {
    bankProtectedContent.classList.remove('hidden');
    const bal = (Math.floor(Math.random() * 90000) + 1000) / 100;
    bankProtectedContent.innerHTML = `<h4>${t('bankBalance')}</h4><div style="font-weight:800;font-size:20px">₹${bal.toFixed(2)}</div>`;
  }

  // Transactions list & recent
  function renderTxList() {
    txList.innerHTML = '';
    if (!txs || txs.length === 0) { txList.innerHTML = `<li class="muted">${t('noTx')}</li>`; return; }
    txs.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `<div><div class="tx-amount">₹${t.amount.toFixed(2)}</div><div class="tx-meta">${t.mode} • ${new Date(t.time).toLocaleString()}</div></div>
                      <div class="tx-meta">${t.name ? `<div style="font-weight:700">${t.name}</div>` : ''}<small>${t.upi || ''}</small></div>`;
      li.addEventListener('click', () => openTxDetail(t));
      txList.appendChild(li);
    });
  }
  function updateRecent() {
    if (!txs || txs.length === 0) { recentBody.textContent = t('noRecent'); return; }
    const top = txs[0];
    recentBody.textContent = `Last: ₹${top.amount.toFixed(2)} • ${top.mode}${top.name ? ' • ' + top.name : ''} • ${new Date(top.time).toLocaleString()}`;
  }
  function openTxDetail(tx) {
    txDetailBody.innerHTML = `<div><strong>Amount:</strong> ₹${tx.amount.toFixed(2)}</div>
      <div><strong>Customer:</strong> ${tx.name || '--'}</div>
      <div><strong>UPI / ID:</strong> ${tx.upi || '--'}</div>
      <div><strong>Mode:</strong> ${tx.mode}</div>
      <div><strong>Status:</strong> ${tx.status}</div>
      <div><strong>Txn ID:</strong> ${tx.id}</div>
      <div><strong>Time:</strong> ${new Date(tx.time).toLocaleString()}</div>`;
    txDetailModal.classList.remove('hidden');
  }
  closeTxDetailBtn && closeTxDetailBtn.addEventListener('click', () => txDetailModal.classList.add('hidden'));

  // Pad & amount modal
  const padButtons = ['1','2','3','4','5','6','7','8','9','.','0','<'];
  pad.innerHTML = '';
  padButtons.forEach(ch => {
    const btn = document.createElement('button'); btn.textContent = ch;
    btn.addEventListener('click', () => {
      const s = amountText.textContent;
      if (ch === '<') amountText.textContent = s.length > 1 ? s.slice(0, -1) : '0';
      else { if (s === '0' && ch !== '.') amountText.textContent = ch; else if (ch === '.' && s.includes('.')) return; else amountText.textContent = s + ch; }
    });
    pad.appendChild(btn);
  });

  function openAmountModal(type) {
    modalContainer.dataset.type = type;
    amountText.textContent = '0';
    modalContainer.classList.remove('hidden');
    confirmAmountBtn.textContent = (type === 'cash') ? t('add') : t('generateQr');
  }
  document.getElementById('newPaymentBtn').addEventListener('click', () => openAmountModal('new'));
  document.getElementById('logPaymentBtn').addEventListener('click', () => openAmountModal('cash'));
  cancelAmountBtn && cancelAmountBtn.addEventListener('click', () => modalContainer.classList.add('hidden'));

  confirmAmountBtn && confirmAmountBtn.addEventListener('click', () => {
    const amt = parseFloat(amountText.textContent) || 0;
    if (amt <= 0) { showAlert('enterAmountAlert'); return; }
    modalContainer.classList.add('hidden');
    if (modalContainer.dataset.type === 'new') {
      currentAmount = amt;
      const merchant = (user && user.upi) ? user.upi : (merchantVpaInput && merchantVpaInput.value) || '';
      if (!merchant || !merchant.includes('@')) { showAlert('merchantVpaMissing'); return; }
      const uri = `upi://pay?pa=${encodeURIComponent(merchant)}&am=${encodeURIComponent(amt.toFixed(2))}`;
      qrcodeEl.innerHTML = ''; new QRCode(qrcodeEl, { text: uri, width: 220, height: 220 });
      qrModal.classList.remove('hidden');
    } else {
      const tx = { id: `CASH-${Date.now()}`, amount: amt, mode: 'CASH', name: '', upi: user.upi || '', status: 'SUCCESS', time: new Date().toISOString() };
      txs.unshift(tx); localStorage.setItem('txs', JSON.stringify(txs)); renderTxList(); updateRecent(); showAlert('cashLogged');
    }
  });

  closeQrBtn && closeQrBtn.addEventListener('click', () => qrModal.classList.add('hidden'));

  // -------------------------
  // SIMULATE PAYMENT - UPDATED
  // Auto voice playback immediately after payment (UPI)
  // -------------------------
  simulatePaymentBtn && simulatePaymentBtn.addEventListener('click', () => {
    const payer = payerNameInput.value.trim();
    const tx = { id: `TXN-${Date.now()}`, amount: currentAmount, mode: 'UPI', name: payer, upi: user.upi || '', status: 'SUCCESS', time: new Date().toISOString() };

    // save transaction
    txs.unshift(tx); localStorage.setItem('txs', JSON.stringify(txs));

    // close modal & update UI
    qrModal.classList.add('hidden');
    renderTxList(); updateRecent();

    // -------------------------
    // AUTO VOICE (new) - speaks immediately
    // -------------------------
    try {
      if (window.speechSynthesis) {
        // choose language for TTS where possible
        // prefer en-IN for numbers; if user selected kn/hi/te we still use en-IN for clarity,
        // but you can change utter.lang for localized voices if desired.
        const langMap = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN', te: 'te-IN' };
        const utterLang = langMap[lang] || 'en-IN';

        // Construct voice message. Use 'customer' fallback if name empty.
        const customerText = payer || (lang === 'kn' ? 'ಗ್ರಾಹಕ' : lang === 'hi' ? 'ग्राहक' : lang === 'te' ? 'ఖాతాదారు' : 'customer');
        const message = (() => {
          // Use language-specific phrases where possible (simple mapping)
          if (lang === 'kn') return `ರೂಪಾಯಿ ${currentAmount.toFixed(2)} ಸ್ವೀಕರಿಸಲಾಗಿದೆ ${customerText} ರಿಂದ`;
          if (lang === 'hi') return `रुपये ${currentAmount.toFixed(2)} प्राप्त हुए ${customerText} से`;
          if (lang === 'te') return `రూ ${currentAmount.toFixed(2)} పొందబడినది ${customerText} నుండి`;
          // default english
          return `Rupees ${currentAmount.toFixed(2)} received from ${customerText}`;
        })();

        const utter = new SpeechSynthesisUtterance(message);
        utter.lang = utterLang;
        // optional: slightly slower for clarity
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      }
    } catch (e) {
      console.warn('Voice output error:', e);
    }

    // final alert (translated)
    showAlert('paymentSimulated');
  });

  // export / clear
  exportBtn && exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(txs, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = 'transactions.json'; document.body.appendChild(a); a.click(); a.remove();
  });
  clearBtn && clearBtn.addEventListener('click', () => { if (!confirm('Clear all local data?')) return; localStorage.clear(); location.reload(); });

  // init
  function populateUserUI() {
    storeTitle.textContent = localStorage.getItem('storeName') || 'My Shop';
    bankInfo.textContent = user.bank ? `${user.bank} • ${user.upi}` : 'No bank linked';
    profileBtn.textContent = user.upi ? user.upi.split('@')[0].slice(0,2).toUpperCase() : 'ME';
    renderTxList(); updateRecent();
  }

  function init() {
    navStack = [];
    if (FORCE_NEW_ONLOAD) { localStorage.removeItem('user'); user = {}; } else { user = JSON.parse(localStorage.getItem('user') || '{}'); }
    if (user && user.phone) { showPage('home'); populateUserUI(); } else { showPage('phone'); }
    applyLangAll();
  }
  init();

  // debug helper
  window._app = { user: () => JSON.parse(localStorage.getItem('user') || '{}'), txs: () => JSON.parse(localStorage.getItem('txs') || '[]') };

})();
