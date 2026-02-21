// --- 1. FIREBASE SETUP & IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyB1mNZs7hCrlC1KzcTEziVrVgp3LAJAYXA",
    authDomain: "smartcampus-16896.firebaseapp.com",
    projectId: "smartcampus-16896",
    storageBucket: "smartcampus-16896.firebasestorage.app",
    messagingSenderId: "1095354409097",
    appId: "1:1095354409097:web:d8b83710eb01ecf5076658"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 2. GLOBAL UTILITIES & TOAST NOTIFICATIONS ---
const user = JSON.parse(localStorage.getItem('user'));

window.logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Route Protection 
if (!user && (window.location.pathname.includes('admin.html') || window.location.pathname.includes('student.html') || window.location.pathname.includes('student-fees.html') || window.location.pathname.includes('student-profile.html') || window.location.pathname.includes('net-banking.html') || window.location.pathname.includes('student-home.html') || window.location.pathname.includes('about-college.html'))) {
    window.location.href = 'index.html';
}

window.showToast = (message, type = 'success') => {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = type === 'error' ? '❌' : (type === 'warning' ? '⚠️' : '✅');
    toast.innerHTML = `<span style="font-size: 1.2em;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
};

// --- SAFE DROPDOWN BUILDER ---
function safelyPopulateDropdown(selectId, optionsArray, currentValue) {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;
    
    selectEl.options.length = 0; 
    
    optionsArray.forEach(opt => {
        selectEl.add(new Option(opt.label, opt.value));
    });

    if (Array.from(selectEl.options).some(o => o.value === currentValue)) {
        selectEl.value = currentValue;
    } else {
        selectEl.selectedIndex = 0;
    }
}

// 💥 DYNAMIC DROPDOWNS ENGINE (For Registration & Profile) 💥
function initDynamicDropdowns(courseRef, yearId, semId, branchId, currentData = {}) {
    const courseSelect = document.getElementById(courseRef); 
    const yearSelect = document.getElementById(yearId);
    if (!yearSelect) return;

    const render = () => {
        const course = courseSelect ? courseSelect.value : courseRef;
        const savedYear = yearSelect.value;
        const semSelect = document.getElementById(semId);
        const branchSelect = document.getElementById(branchId);
        
        let years = [{label: '1st Year', value: '1st Year'}, {label: '2nd Year', value: '2nd Year'}];
        if (course === 'B.Tech') {
            years.push({label: '3rd Year', value: '3rd Year'}, {label: '4th Year', value: '4th Year'});
        }
        safelyPopulateDropdown(yearId, years, savedYear);
        
        const year = yearSelect.value;

        if (semSelect) {
            const savedSem = semSelect.value;
            let sems = [];
            if (year === '1st Year') sems = [{label: 'Semester 1', value: 'Semester 1'}, {label: 'Semester 2', value: 'Semester 2'}];
            else if (year === '2nd Year') sems = [{label: 'Semester 3', value: 'Semester 3'}, {label: 'Semester 4', value: 'Semester 4'}];
            else if (year === '3rd Year') sems = [{label: 'Semester 5', value: 'Semester 5'}, {label: 'Semester 6', value: 'Semester 6'}];
            else if (year === '4th Year') sems = [{label: 'Semester 7', value: 'Semester 7'}, {label: 'Semester 8', value: 'Semester 8'}];
            safelyPopulateDropdown(semId, sems, savedSem);
        }

        if (branchSelect) {
            const savedBranch = branchSelect.value;
            let branches = [];
            if (course === 'B.Tech') {
                if (year === '1st Year') {
                    branches.push({label: 'Common 1st Year', value: 'Common 1st Year'});
                } else {
                    branches = [
                        {label: 'Select Core Branch', value: ''},
                        {label: 'Computer Science and Engineering', value: 'Computer Science and Engineering'},
                        {label: 'Data Science', value: 'Data Science'},
                        {label: 'Electrical Communication Engineering', value: 'Electrical Communication Engineering'},
                        {label: 'EE', value: 'EE'},
                        {label: 'EEE', value: 'EEE'},
                        {label: 'Civil', value: 'Civil'},
                        {label: 'Mechanical', value: 'Mechanical'}
                    ];
                }
            } else if (course === 'MBA') {
                branches = [
                    {label: 'Select Specialization', value: ''},
                    {label: 'Human Resources (HR)', value: 'Human Resources (HR)'},
                    {label: 'Finance', value: 'Finance'},
                    {label: 'Marketing', value: 'Marketing'},
                    {label: 'IT & Systems', value: 'IT & Systems'},
                    {label: 'Operations', value: 'Operations'}
                ];
            } else if (course === 'MCA') {
                branches.push({label: 'Master of Computer Applications', value: 'Master of Computer Applications'});
            }
            safelyPopulateDropdown(branchId, branches, savedBranch);
        }
    };

    if (courseSelect) courseSelect.addEventListener('change', render);
    yearSelect.addEventListener('change', render);
    render();

    if (currentData.year) {
        yearSelect.value = currentData.year;
        render(); 
        if (currentData.semester && document.getElementById(semId)) document.getElementById(semId).value = currentData.semester;
        if (currentData.branch && document.getElementById(branchId)) document.getElementById(branchId).value = currentData.branch;
    }
}

// 💥 NOTICEBOARD DROPDOWNS ENGINE 💥
function initAdminNoticeDropdowns() {
    const nCourse = document.getElementById('noticeCourse');
    const nYear = document.getElementById('noticeYear');
    if (!nCourse || !nYear) return;

    const renderNotices = () => {
        const course = nCourse.value;
        const currentYear = nYear.value || "All";
        const currentSem = document.getElementById('noticeSemester').value || "All";
        const currentBranch = document.getElementById('noticeBranch').value || "All";
        
        let years = [{label: 'All Years', value: 'All'}, {label: '1st Year', value: '1st Year'}, {label: '2nd Year', value: '2nd Year'}];
        if (course === 'B.Tech') {
            years.push({label: '3rd Year', value: '3rd Year'}, {label: '4th Year', value: '4th Year'});
        }
        safelyPopulateDropdown('noticeYear', years, currentYear);

        const selectedYear = nYear.value;
        let sems = [{label: 'All Semesters', value: 'All'}];
        if (selectedYear === '1st Year') sems.push({label: 'Semester 1', value: 'Semester 1'}, {label: 'Semester 2', value: 'Semester 2'});
        else if (selectedYear === '2nd Year') sems.push({label: 'Semester 3', value: 'Semester 3'}, {label: 'Semester 4', value: 'Semester 4'});
        else if (selectedYear === '3rd Year') sems.push({label: 'Semester 5', value: 'Semester 5'}, {label: 'Semester 6', value: 'Semester 6'});
        else if (selectedYear === '4th Year') sems.push({label: 'Semester 7', value: 'Semester 7'}, {label: 'Semester 8', value: 'Semester 8'});
        safelyPopulateDropdown('noticeSemester', sems, currentSem);

        let branches = [{label: 'All Branches', value: 'All'}];
        if (course === 'B.Tech') {
            if (selectedYear === '1st Year') {
                branches.push({label: 'Common 1st Year', value: 'Common 1st Year'});
            } else {
                branches.push(
                    {label: 'Computer Science and Engineering', value: 'Computer Science and Engineering'},
                    {label: 'Data Science', value: 'Data Science'},
                    {label: 'Electrical Communication Engineering', value: 'Electrical Communication Engineering'},
                    {label: 'EE', value: 'EE'}, {label: 'EEE', value: 'EEE'}, {label: 'Civil', value: 'Civil'}, {label: 'Mechanical', value: 'Mechanical'}
                );
            }
        } else if (course === 'MBA') {
            branches.push(
                {label: 'Human Resources (HR)', value: 'Human Resources (HR)'},
                {label: 'Finance', value: 'Finance'}, {label: 'Marketing', value: 'Marketing'},
                {label: 'IT & Systems', value: 'IT & Systems'}, {label: 'Operations', value: 'Operations'}
            );
        } else if (course === 'MCA') {
            branches.push({label: 'Master of Computer Applications', value: 'Master of Computer Applications'});
        }
        safelyPopulateDropdown('noticeBranch', branches, currentBranch);
    };

    nCourse.addEventListener('change', renderNotices);
    nYear.addEventListener('change', renderNotices);
    renderNotices();
}

// --- 3. STUDENT REGISTRATION ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    initDynamicDropdowns('course', 'year', 'semester', 'branch'); 
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const regNumberInput = document.getElementById('regNumber').value;
        const submitBtn = registerForm.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.innerText = "Checking Details...";
        try {
            const q = query(collection(db, "users"), where("registration_number", "==", regNumberInput));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                showToast(`Error: Registration '${regNumberInput}' is already registered!`, 'error');
                submitBtn.disabled = false;
                submitBtn.innerText = "Register Account";
                return; 
            }
            await addDoc(collection(db, "users"), {
                role: "Student", full_name: document.getElementById('fullName').value,
                course: document.getElementById('course').value, branch: document.getElementById('branch').value,
                year: document.getElementById('year').value, semester: document.getElementById('semester').value, 
                section: "Unassigned", registration_number: regNumberInput,
                password: document.getElementById('password').value, profile_pic: "", fee_status: "Unpaid" 
            });
            showToast('Registration Successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'student-login.html', 1500);
        } catch (error) {
            showToast('Error registering account.', 'error');
            submitBtn.disabled = false; submitBtn.innerText = "Register Account";
        }
    });
}

// --- 4. STUDENT LOGIN ---
const studentLoginForm = document.getElementById('studentLoginForm');
if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const regNum = document.getElementById('regNumber').value;
        const pass = document.getElementById('password').value;
        const q = query(collection(db, "users"), where("registration_number", "==", regNum), where("password", "==", pass), where("role", "==", "Student"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            userData.id = querySnapshot.docs[0].id; 
            localStorage.setItem('user', JSON.stringify(userData));
            window.location.href = 'student-home.html'; 
        } else {
            document.getElementById('errorMsg').style.display = 'block';
        }
    });
}

// --- 5. ADMIN LOGIN ---
const adminLoginForm = document.getElementById('loginForm');
if (adminLoginForm) {
    ensureAdminExists();
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim(); 
        const pass = document.getElementById('password').value.trim();
        const submitBtn = adminLoginForm.querySelector('button');
        submitBtn.innerText = "Authenticating..."; submitBtn.disabled = true;
        try {
            const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", pass), where("role", "==", "Admin"));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                userData.id = querySnapshot.docs[0].id;
                localStorage.setItem('user', JSON.stringify(userData));
                window.location.href = 'admin.html';
            } else {
                document.getElementById('errorMsg').style.display = 'block';
                document.getElementById('errorMsg').innerText = "Invalid Username or Password.";
            }
        } catch (error) {
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('errorMsg').innerText = "Database Error.";
        } finally {
            submitBtn.innerText = "Access System"; submitBtn.disabled = false;
        }
    });
}

async function ensureAdminExists() {
    try {
        const q = query(collection(db, "users"), where("username", "==", "admin1"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            await addDoc(collection(db, "users"), { role: "Admin", username: "admin1", password: "admin123", full_name: "System Admin" });
        }
    } catch (e) { }
}

// --- 6. STUDENT DASHBOARD MASTER LOGIC ---
if (user?.role === 'Student') {
    const welcomeText = document.getElementById('welcomeText');
    const timeGreeting = document.getElementById('timeGreeting');
    const welcomeName = document.getElementById('welcomeName');
    
    if (welcomeText && window.location.pathname.includes('student.html') && !window.location.pathname.includes('student-home')) {
         welcomeText.innerText = `Maintenance Portal`;
    }

    if (timeGreeting && welcomeName) {
        const hour = new Date().getHours();
        let greeting = "Good Evening";
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 17) greeting = "Good Afternoon";
        timeGreeting.innerText = greeting;
    }

    if (user.id) {
        const userDocRef = doc(db, "users", user.id);
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const freshUser = docSnap.data();
                freshUser.id = docSnap.id;
                localStorage.setItem('user', JSON.stringify(freshUser));
                
                const headerAvatar = document.getElementById('headerAvatar');
                const academicInfo = document.getElementById('academicInfo'); 
                const avatarUrl = freshUser.profile_pic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                
                if (headerAvatar) headerAvatar.src = avatarUrl;
                if (welcomeName) welcomeName.innerText = freshUser.full_name;
                if (academicInfo) {
                    academicInfo.innerText = `${freshUser.course} in ${freshUser.branch} | ${freshUser.year || '1st Year'} (${freshUser.semester || 'Semester 1'}) | Sec: ${freshUser.section || 'Unassigned'}`;
                }

                const profileAvatarLarge = document.getElementById('profileAvatarLarge');
                const profileNameDisplay = document.getElementById('profileNameDisplay');
                const profileYear = document.getElementById('profileYear');
                
                if (profileAvatarLarge) profileAvatarLarge.src = avatarUrl;
                if (profileNameDisplay) profileNameDisplay.innerText = freshUser.full_name;
                
                if (profileYear) {
                    initDynamicDropdowns(freshUser.course || 'B.Tech', 'profileYear', 'profileSemester', 'profileBranch', { 
                        year: freshUser.year, semester: freshUser.semester, branch: freshUser.branch 
                    });
                }
            }
        });
    }

    if (document.getElementById('complaintForm')) initQueriesSystem();
    if (document.getElementById('paymentForm')) initFeeSystem();
    if (document.getElementById('profileYear')) initProfileSystem(user.profile_pic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');

    // LIVE NOTICEBOARD RECEIVER
    const noticeBoard = document.getElementById('studentNoticeBoard');
    if(noticeBoard) {
        onSnapshot(collection(db, "notices"), (snapshot) => {
            const activeUser = JSON.parse(localStorage.getItem('user'));
            let notices = [];
            snapshot.forEach(doc => notices.push({id: doc.id, ...doc.data()}));
            
            notices = notices.filter(n => {
                if (n.targets && Array.isArray(n.targets)) {
                    return n.targets.some(t => 
                        (t.course === 'All' || t.course === activeUser.course) &&
                        (t.year === 'All' || t.year === activeUser.year) &&
                        (t.semester === 'All' || t.semester === activeUser.semester) &&
                        (t.branch === 'All' || t.branch === activeUser.branch)
                    );
                } else if (n.course) {
                    return (n.course === 'All' || n.course === activeUser.course) &&
                           (n.year === 'All' || n.year === activeUser.year) &&
                           (n.semester === 'All' || n.semester === activeUser.semester) &&
                           (n.branch === 'All' || n.branch === activeUser.branch);
                }
                return false;
            });

            notices.sort((a, b) => b.timestamp - a.timestamp); 

            if(notices.length === 0) {
                noticeBoard.innerHTML = '<p style="color: #94a3b8; text-align: center; margin-top: 60px; font-style: italic;">No new announcements at this time.</p>';
            } else {
                noticeBoard.innerHTML = notices.map((n, i) => `
                    <div class="notice-item ${i === 0 ? 'highlight' : ''}">
                        <div style="font-size: 0.75em; color: ${i===0 ? '#fca5a5' : '#64748b'}; font-weight: bold; margin-bottom: 3px;">
                            ${new Date(n.timestamp).toLocaleString()}
                        </div>
                        <p style="margin: 0; color: ${i===0 ? '#f8fafc' : '#cbd5e1'}; font-weight: ${i===0 ? 'bold' : 'normal'}; line-height: 1.4;">
                            ${n.message}
                        </p>
                    </div>
                `).join('');
            }
        });
    }
}

function initProfileSystem(avatarUrl) {
    const profileImageInput = document.getElementById('profileImageInput');
    if(profileImageInput) {
        profileImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showToast('Uploading image...', 'warning');
            const CLOUD_NAME = "dmy74celx"; 
            const UPLOAD_PRESET = "rcyp6gvo"; 
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                const data = await res.json();
                if (data.secure_url) {
                    const userRef = doc(db, "users", user.id);
                    await updateDoc(userRef, { profile_pic: data.secure_url });
                    showToast('Profile picture updated!', 'success');
                }
            } catch(err) { showToast('Failed to upload image.', 'error'); }
        });
    }
}

function initQueriesSystem() {
    const complaintForm = document.getElementById('complaintForm');
    const activeList = document.getElementById('activeComplaintsList');
    const resolvedList = document.getElementById('resolvedComplaintsList');

    if (!complaintForm) return;

    const activeUser = JSON.parse(localStorage.getItem('user')) || user;
    const safeQueryId = activeUser.id || activeUser.registration_number || "UNKNOWN_USER";

    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descInput = document.getElementById('description');
        const submitBtn = complaintForm.querySelector('button');

        if (!descInput || !descInput.value.trim()) return;

        submitBtn.disabled = true;
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Submitting securely...";

        try {
            await addDoc(collection(db, "complaints"), {
                student_id: safeQueryId,
                student_details: `${activeUser.full_name || 'Unknown'} | ${activeUser.course || 'Course'} (${activeUser.branch || 'Branch'}) - Sec: ${activeUser.section || 'Unassigned'}`,
                reg_number: activeUser.registration_number || "Unknown",
                description: descInput.value.trim(),
                status: "Pending",
                created_at: Date.now()
            });
            showToast('Query submitted successfully!', 'success');
            complaintForm.reset(); 
        } catch (error) {
            showToast('Failed to submit query. Check internet connection.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    window.deleteQuery = async (queryId) => {
        if(confirm("Are you sure you want to permanently delete this query?")) {
            try { 
                await deleteDoc(doc(db, "complaints", queryId)); 
                showToast("Query deleted successfully!", "success");
            } catch(error) { showToast("Failed to delete query.", "error"); }
        }
    };

    const q = query(collection(db, "complaints"), where("student_id", "==", safeQueryId));
    
    onSnapshot(q, (querySnapshot) => {
        let complaints = [];
        querySnapshot.forEach((doc) => complaints.push({ id: doc.id, ...doc.data() }));
        complaints.sort((a, b) => b.created_at - a.created_at);

        const activeComplaints = complaints.filter(c => c.status !== 'Resolved');
        const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');

        if (activeList) {
            activeList.innerHTML = activeComplaints.length === 0 
                ? '<p style="color: #64748b; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; text-align: center;">No active queries at the moment.</p>' 
                : activeComplaints.map((c) => `
                    <div class="card" style="background: rgba(15, 23, 42, 0.6); position: relative; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                        ${c.status === 'Pending' ? `<button onclick="window.deleteQuery('${c.id}')" style="position: absolute; top: 15px; right: 15px; background: rgba(225, 29, 72, 0.1); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.3); padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8em; transition: 0.3s;" onmouseover="this.style.background='rgba(225, 29, 72, 0.3)'" onmouseout="this.style.background='rgba(225, 29, 72, 0.1)'">🗑️ Delete</button>` : ''}
                        <p style="padding-right: 80px; color: #f8fafc; margin: 0 0 15px 0; font-size: 1.05em;"><strong>Query:</strong> ${c.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                            <small style="color: #94a3b8;">Status: <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span></small>
                            <small style="color: #64748b;">${new Date(c.created_at).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('');
        }

        if (resolvedList) {
            resolvedList.innerHTML = resolvedComplaints.length === 0 
                ? '<p style="color: #64748b; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; text-align: center;">No resolved queries yet.</p>' 
                : resolvedComplaints.map((c) => `
                    <div class="card" style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981; margin-bottom: 15px;">
                        <p style="color: #f8fafc; margin: 0 0 15px 0;"><strong>Query:</strong> ${c.description}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
                            <small style="color: #94a3b8;">Status: <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span></small>
                            <small style="color: #64748b;">${new Date(c.created_at).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('');
        }
    });
}

function initFeeSystem() {
    const paymentForm = document.getElementById('paymentForm');
    const historyList = document.getElementById('paymentHistoryList');
    
    const activeUser = JSON.parse(localStorage.getItem('user')) || user;
    let semString = activeUser.semester || "Semester 1";
    let semNumber = parseInt(semString.replace("Semester ", "")) || 1;
    const totalFeeAmount = semNumber * 50000; 
    let remainingBalance = totalFeeAmount;

    const payMethodSelect = document.getElementById('payMethod');
    const upiUI = document.getElementById('upiUI');
    const cardUI = document.getElementById('cardUI');
    
    if (payMethodSelect) {
        payMethodSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            upiUI.style.display = (val === 'UPI / QR') ? 'block' : 'none';
            cardUI.style.display = (val === 'Credit/Debit Card') ? 'block' : 'none';
        });
    }

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Number(document.getElementById('payAmount').value);
        const gateway = document.getElementById('payGateway').value;
        const method = document.getElementById('payMethod').value;
        
        const freshUser = JSON.parse(localStorage.getItem('user')) || user;

        if (amount > remainingBalance) {
            showToast(`Error: You only owe ₹${remainingBalance.toLocaleString()}.`, 'warning');
            return;
        }

        if (method === 'Net Banking') {
            const pendingTxn = { amount, gateway, method };
            localStorage.setItem('pendingTxn', JSON.stringify(pendingTxn));
            window.location.href = 'net-banking.html';
            return; 
        }

        const btn = document.getElementById('payFeeBtn');
        btn.innerText = `Processing via ${gateway}...`;
        btn.disabled = true;

        setTimeout(async () => {
            try {
                const txnId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
                await addDoc(collection(db, "payments"), {
                    student_id: freshUser.id,
                    full_name: freshUser.full_name,
                    registration_number: freshUser.registration_number,
                    course: freshUser.course,
                    branch: freshUser.branch,
                    section: freshUser.section || "Unassigned",
                    year: freshUser.year || "N/A",           
                    semester: freshUser.semester || "N/A",   
                    amount: amount,
                    gateway: gateway,
                    method: method,
                    transaction_id: txnId,
                    date: Date.now()
                });
                showToast(`Successfully paid ₹${amount.toLocaleString()}!`, 'success');
                paymentForm.reset();
            } catch (error) { showToast("Payment failed.", "error"); } 
            finally { btn.innerText = "Process Secure Payment"; btn.disabled = false; }
        }, 2000);
    });

    const historySemesterFilter = document.getElementById('historySemesterFilter');
    if (historySemesterFilter) historySemesterFilter.addEventListener('change', renderPaymentHistory);

    function renderPaymentHistory() {
        if (!window.userPaymentHistory) return;
        const filterVal = document.getElementById('historySemesterFilter') ? document.getElementById('historySemesterFilter').value : "All";
        let filteredPayments = window.userPaymentHistory;
        if (filterVal !== "All") filteredPayments = window.userPaymentHistory.filter(p => p.semester === filterVal);

        if (filteredPayments.length === 0) {
            historyList.innerHTML = '<p style="color: #94a3b8; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 8px; text-align: center;">No transactions found for this selection.</p>';
        } else {
            historyList.innerHTML = filteredPayments.map((p) => `
                <div class="card" style="border-left: 4px solid #10b981; margin-bottom: 15px; background: rgba(15, 23, 42, 0.6);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #10b981; font-weight: 800; font-size: 1.2em;">₹${p.amount.toLocaleString()}</span>
                        <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">Success</span>
                    </div>
                    <p style="margin-top: 8px; color: #94a3b8; font-size: 0.9em; display: flex; justify-content: space-between; flex-wrap: wrap;">
                        <span><small>TXN ID: ${p.transaction_id}</small></span>
                        <span style="color: #cbd5e1;"><small>🗓️ Paid during: <strong>${p.semester || 'N/A'}</strong></small></span>
                    </p>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="window.viewReceipt('${p.id}')" style="flex: 1; background: transparent; color: #6366f1; border: 1px solid #6366f1; padding: 10px; border-radius: 8px; cursor: pointer;">👁️ View</button>
                        <button onclick="window.downloadReceipt('${p.id}')" style="flex: 1; background: transparent; color: #10b981; border: 1px solid #10b981; padding: 10px; border-radius: 8px; cursor: pointer;">↓ Download</button>
                    </div>
                </div>
            `).join('');
        }
    }

    const q = query(collection(db, "payments"), where("student_id", "==", user.id));
    onSnapshot(q, (querySnapshot) => {
        let payments = [];
        let totalPaid = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            payments.push({ id: doc.id, ...data });
            totalPaid += data.amount; 
        });
        remainingBalance = totalFeeAmount - totalPaid;
        window.userPaymentHistory = payments.sort((a, b) => b.date - a.date); 
        document.getElementById('totalOwedDisplay').innerText = `₹${totalFeeAmount.toLocaleString()}`;
        document.getElementById('totalPaidDisplay').innerText = `₹${totalPaid.toLocaleString()}`;
        document.getElementById('remainingBalanceDisplay').innerText = `₹${remainingBalance.toLocaleString()}`;
        const payAmountInput = document.getElementById('payAmount');
        const payFeeBtn = document.getElementById('payFeeBtn');
        if (remainingBalance <= 0) {
            payAmountInput.disabled = true;
            payFeeBtn.disabled = true;
            payFeeBtn.innerText = "Dues Cleared";
        } else {
            payAmountInput.max = remainingBalance;
            payAmountInput.placeholder = `Max: ₹${remainingBalance}`;
        }
        renderPaymentHistory();
    });
}

function buildReceiptPDF(txn) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    pdf.setFontSize(24);
    pdf.setTextColor(99, 102, 241); 
    pdf.text("SmartCampus Hub", 105, 20, null, null, "center");
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Official Payment Receipt", 105, 30, null, null, "center");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Transaction ID: ${txn.transaction_id}`, 20, 50);
    pdf.text(`Date & Time: ${new Date(txn.date).toLocaleString()}`, 20, 58);
    pdf.text(`Payment Gateway: ${txn.gateway}`, 20, 66);
    pdf.text(`Payment Method: ${txn.method}`, 20, 74);
    pdf.text("--------------------------------------------------------------------------------------", 20, 85);
    pdf.setFontSize(12);
    pdf.text(`Received From: ${txn.full_name}`, 20, 95);
    pdf.text(`Registration No: ${txn.registration_number}`, 20, 103);
    pdf.text(`Course Details: ${txn.course} (${txn.branch}) | Sec: ${txn.section || 'N/A'} | ${txn.year} (${txn.semester})`, 20, 111);
    pdf.text("--------------------------------------------------------------------------------------", 20, 120);
    pdf.setFontSize(16);
    pdf.setTextColor(16, 185, 129); 
    pdf.text(`Amount Paid: INR ${txn.amount.toLocaleString()}`, 20, 135);
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Status: SUCCESSFUL", 20, 145);
    return pdf;
}

window.downloadReceipt = (paymentId) => {
    const txn = window.userPaymentHistory.find(p => p.id === paymentId);
    if (!txn) return;
    const pdf = buildReceiptPDF(txn);
    pdf.save(`Receipt_${txn.transaction_id}.pdf`);
};

window.viewReceipt = (paymentId) => {
    const txn = window.userPaymentHistory.find(p => p.id === paymentId);
    if (!txn) return;
    const pdf = buildReceiptPDF(txn);
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank");
};

// --- 7. ADMIN DASHBOARD LOGIC ---
if (user?.role === 'Admin') {
    const semesterToYearMap = {
        1: "1st Year", 2: "1st Year",
        3: "2nd Year", 4: "2nd Year",
        5: "3rd Year", 6: "3rd Year",
        7: "4th Year", 8: "4th Year"
    };

    window.updateStatus = async (complaintId, newStatus) => {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, { status: newStatus });
        showToast(`Query marked as ${newStatus}`, "success");
    };
    
    window.promoteStudent = async (studentId) => {
        const selectedSemString = document.getElementById(`promoteSem_${studentId}`).value;
        const semNumber = parseInt(selectedSemString.replace("Semester ", ""));
        const calculatedYear = semesterToYearMap[semNumber];

        try {
            const studentRef = doc(db, "users", studentId);
            await updateDoc(studentRef, { year: calculatedYear, semester: selectedSemString });
            showToast(`Promoted to ${selectedSemString} (${calculatedYear})!`, 'success');
        } catch (error) {
            showToast('Failed to update student.', 'error');
        }
    };

    window.updateSection = async (studentId) => {
        const newSec = document.getElementById(`assignSec_${studentId}`).value;
        try {
            const studentRef = doc(db, "users", studentId);
            await updateDoc(studentRef, { section: newSec });
            showToast(`Section assigned to ${newSec}!`, 'success');
        } catch (error) {
            showToast('Failed to assign section.', 'error');
        }
    };

    // MULTI-TARGET BROADCAST LOGIC
    const noticeForm = document.getElementById('noticeForm');
    const addTargetBtn = document.getElementById('addTargetBtn');
    const targetGroupsContainer = document.getElementById('targetGroupsContainer');
    let noticeTargets = [];

    function renderTargets() {
        if (!targetGroupsContainer) return;
        targetGroupsContainer.innerHTML = noticeTargets.map((t, i) => `
            <span style="background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: white; padding: 6px 12px; border-radius: 8px; font-size: 0.85em; display: inline-flex; align-items: center; gap: 8px;">
                ${t.course} ➝ ${t.year} ➝ ${t.semester} ➝ ${t.branch}
                <b style="cursor: pointer; color: #fca5a5; font-size: 1.1em;" onclick="removeNoticeTarget(${i})" title="Remove">✖</b>
            </span>
        `).join('');
    }

    window.removeNoticeTarget = (index) => {
        noticeTargets.splice(index, 1);
        renderTargets();
    };

    if (noticeForm && addTargetBtn) {
        initAdminNoticeDropdowns(); 

        addTargetBtn.addEventListener('click', () => {
            const c = document.getElementById('noticeCourse').value;
            const y = document.getElementById('noticeYear').value;
            const s = document.getElementById('noticeSemester').value;
            const b = document.getElementById('noticeBranch').value;
            
            if (!noticeTargets.some(t => t.course === c && t.year === y && t.semester === s && t.branch === b)) {
                noticeTargets.push({ course: c, year: y, semester: s, branch: b });
                renderTargets();
            } else {
                showToast("Audience already added!", "warning");
            }
        });

        noticeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (noticeTargets.length === 0) {
                noticeTargets.push({
                    course: document.getElementById('noticeCourse').value,
                    year: document.getElementById('noticeYear').value,
                    semester: document.getElementById('noticeSemester').value,
                    branch: document.getElementById('noticeBranch').value
                });
            }

            const btn = noticeForm.querySelector('button[type="submit"]');
            btn.innerText = "Broadcasting...";
            btn.disabled = true;

            try {
                await addDoc(collection(db, "notices"), {
                    targets: noticeTargets,
                    message: document.getElementById('noticeMessage').value,
                    timestamp: Date.now()
                });
                showToast("Broadcast pushed successfully!", "success");
                noticeForm.reset();
                noticeTargets = []; 
                renderTargets();    
                initAdminNoticeDropdowns(); 
            } catch (error) {
                showToast("Failed to broadcast.", "error");
            } finally {
                btn.innerText = "Push Broadcast";
                btn.disabled = false;
            }
        });
    }

    loadAdminData();
}

// 💥 ADMIN MAINTENANCE QUERIES RENDERER (ULTRA-STRICT FILTER) 💥
window.renderAdminQueries = function() {
    try {
        const listDiv = document.getElementById('adminComplaintsList');
        const filterDropdown = document.getElementById('adminQueryFilter');
        
        // Forcefully grab the exact text value and trim hidden spaces
        const filterVal = filterDropdown ? String(filterDropdown.value).trim() : "All";
        
        if (!listDiv) return;
        
        if (!window.allComplaints) {
            listDiv.innerHTML = '<p style="color: #cbd5e1; text-align: center; padding: 20px;">Fetching data from secure server...</p>';
            return;
        }

        let filtered = window.allComplaints;

        // Strict Filtering Logic
        if (filterVal !== "All") {
            filtered = window.allComplaints.filter(c => {
                const docStatus = c.status ? String(c.status).trim() : 'Pending';
                return docStatus === filterVal;
            });
        }

        if (filtered.length === 0) {
            listDiv.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 8px;">No queries exist in the database for status: <strong style="color: #f8fafc;">${filterVal}</strong>.</p>`;
            return;
        }

        listDiv.innerHTML = filtered.map((c) => {
            const status = c.status || 'Pending';
            const regNumber = c.reg_number || 'N/A';
            const details = c.student_details || 'Unknown Student';
            const desc = c.description || 'No description provided';
            
            let bColor = '#f59e0b';
            let bgBadge = 'rgba(245, 158, 11, 0.2)';
            let textBadge = '#fbbf24';
            
            if (status === 'Resolved') {
                bColor = '#10b981'; bgBadge = 'rgba(16, 185, 129, 0.2)'; textBadge = '#34d399';
            } else if (status === 'In Progress') {
                bColor = '#3b82f6'; bgBadge = 'rgba(59, 130, 246, 0.2)'; textBadge = '#60a5fa';
            }

            return `
                <div class="card" style="margin-bottom: 15px; border-left: 4px solid ${bColor};">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <span style="color: #6366f1; font-weight: 600;">Reg: ${regNumber}</span>
                        <span class="badge" style="background: ${bgBadge}; color: ${textBadge}; border: 1px solid currentColor;">${status}</span>
                    </div>
                    <p style="margin-top: 10px; color: #cbd5e1; font-size: 0.95em;"><strong>Info:</strong> ${details}</p>
                    <p style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; color: #f8fafc; margin-bottom: 15px; font-size: 0.95em; border: 1px solid rgba(255,255,255,0.05);"><strong>Issue:</strong> ${desc}</p>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        ${status === 'Pending' ? `<button onclick="window.updateStatus('${c.id}', 'In Progress')" style="padding: 8px 15px; border-radius: 8px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); cursor: pointer; transition: 0.3s; font-weight: bold;">Mark 'In Progress'</button>` : ''}
                        ${status === 'In Progress' ? `<button onclick="window.updateStatus('${c.id}', 'Resolved')" style="padding: 8px 15px; border-radius: 8px; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); cursor: pointer; transition: 0.3s; font-weight: bold;">Mark 'Resolved'</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("Render Error:", err);
    }
};

function loadAdminData() {
    const adminComplaintsList = document.getElementById('adminComplaintsList');
    
    // 1. Fetch Maintenance Queries
    if(adminComplaintsList) {
        adminComplaintsList.innerHTML = '<p style="color: #6366f1; text-align: center; padding: 20px;">Fetching live queries from Firebase...</p>';
        
        try {
            onSnapshot(collection(db, "complaints"), (querySnapshot) => {
                let complaints = [];
                let resolvedCount = 0;
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    complaints.push({ id: doc.id, ...data });
                    if (data.status === 'Resolved') resolvedCount++;
                });
                
                complaints.sort((a, b) => b.created_at - a.created_at);
                window.allComplaints = complaints; 
                
                if(document.getElementById('totalCount')) document.getElementById('totalCount').innerText = complaints.length;
                if(document.getElementById('resolvedCount')) document.getElementById('resolvedCount').innerText = resolvedCount;

                window.renderAdminQueries(); 
            }, (error) => {
                console.error("FIREBASE ERROR:", error);
                alert("🚨 FIREBASE DATABASE ERROR 🚨\n\nYour database is blocking access! This usually means your 30-day Test Mode Rules have expired.\n\nPlease go to Firebase Console -> Firestore Database -> Rules -> set 'allow read, write: if true;'");
                adminComplaintsList.innerHTML = `
                    <div style="background: rgba(225,29,72,0.1); border: 1px solid rgba(225,29,72,0.3); padding: 20px; border-radius: 8px; color: #fda4af;">
                        <h3 style="margin-top: 0;">⚠️ Database Connection Blocked!</h3>
                        <p>Firebase returned an error: <em>${error.message}</em></p>
                        <p><strong>How to fix:</strong> Log into your Firebase Console -> Go to Firestore Database -> Click the "Rules" tab -> Change your rules to allow read/write.</p>
                    </div>
                `;
            });
        } catch(e) {
            adminComplaintsList.innerHTML = `<p style="color: #fca5a5;">Script Error: ${e.message}</p>`;
        }
    }

    // 2. Fetch Student Database
    if(document.getElementById('adminStudentDatabaseList')) {
        onSnapshot(query(collection(db, "users"), where("role", "!=", "Admin")), (querySnapshot) => {
            let students = [];
            querySnapshot.forEach((doc) => students.push({ id: doc.id, ...doc.data() }));
            window.allStudents = students; 
            applyAdminFilters();
        }, (error) => {
            console.error("FIREBASE STUDENT DB ERROR:", error);
            document.getElementById('adminStudentDatabaseList').innerHTML = `<p style="color: #fda4af; padding: 20px; border: 1px solid #e11d48; border-radius: 8px; text-align: center;">Failed to load students. Database rules might be blocking access.</p>`;
        });

        const searchInput = document.getElementById('adminSearchStudent');
        const branchFilter = document.getElementById('adminBranchFilter');
        if(searchInput) searchInput.addEventListener('input', applyAdminFilters);
        if(branchFilter) branchFilter.addEventListener('change', applyAdminFilters);
    }
}

function applyAdminFilters() {
    const searchInput = document.getElementById('adminSearchStudent');
    const branchFilter = document.getElementById('adminBranchFilter');
    
    const term = searchInput ? searchInput.value.toLowerCase() : "";
    const selectedBranch = branchFilter ? branchFilter.value : "All";

    const filtered = window.allStudents.filter(s => {
        const name = s.full_name ? s.full_name.toLowerCase() : "";
        const reg = s.registration_number ? s.registration_number.toLowerCase() : "";
        
        let sBranch = s.branch || "Common 1st Year";
        let dbBranchUpper = sBranch.trim().toUpperCase();
        if (dbBranchUpper === "CSE") sBranch = "Computer Science and Engineering";
        if (dbBranchUpper === "ECE") sBranch = "Electrical Communication Engineering";
        
        const matchesSearch = name.includes(term) || reg.includes(term);
        const matchesBranch = selectedBranch === "All" || sBranch === selectedBranch;
        
        return matchesSearch && matchesBranch;
    });

    renderAdminStudents(filtered);
}

function renderAdminStudents(students) {
    const listDiv = document.getElementById('adminStudentDatabaseList');
    
    if(students.length === 0) {
        listDiv.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">No students match this filter.</p>';
        return;
    }

    const groupedStudents = {};
    students.forEach(s => {
        let branchName = s.branch || "Common 1st Year / Unassigned";
        let dbBranchUpper = branchName.trim().toUpperCase();
        if (dbBranchUpper === "CSE") branchName = "Computer Science and Engineering";
        if (dbBranchUpper === "ECE") branchName = "Electrical Communication Engineering";

        let courseTag = s.course ? `(${s.course}) ` : "";
        const groupKey = courseTag + branchName;

        if (!groupedStudents[groupKey]) {
            groupedStudents[groupKey] = [];
        }
        groupedStudents[groupKey].push(s);
    });

    let finalHTML = '';
    const sortedGroupKeys = Object.keys(groupedStudents).sort();

    const semesterToYearMap = {
        1: "1st Year", 2: "1st Year",
        3: "2nd Year", 4: "2nd Year",
        5: "3rd Year", 6: "3rd Year",
        7: "4th Year", 8: "4th Year"
    };

    sortedGroupKeys.forEach(groupKey => {
        finalHTML += `
            <div style="margin-top: 35px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid rgba(99, 102, 241, 0.3);">
                <h2 style="color: #818cf8; margin: 0; display: flex; justify-content: space-between; align-items: center; font-size: 1.4em;">
                    <span>🏢 ${groupKey}</span>
                    <span style="font-size: 0.6em; background: rgba(99, 102, 241, 0.15); padding: 5px 12px; border-radius: 20px; color: #cbd5e1; border: 1px solid rgba(99, 102, 241, 0.3);">
                        ${groupedStudents[groupKey].length} Student(s)
                    </span>
                </h2>
            </div>
        `;

        const groupStudents = groupedStudents[groupKey].sort((a, b) => {
            const nameA = a.full_name || "Unknown Name";
            const nameB = b.full_name || "Unknown Name";
            return nameA.localeCompare(nameB);
        });

        finalHTML += groupStudents.map(s => {
            let currentSemString = s.semester || "Semester 1";
            let currentSemNum = parseInt(currentSemString.replace("Semester ", "")) || 1;
            
            let maxSem = (s.course === 'MBA' || s.course === 'MCA') ? 4 : 8;
            
            let semOptionsHTML = "";
            for(let i = currentSemNum; i <= maxSem; i++) {
                semOptionsHTML += `<option value="Semester ${i}">Sem ${i} (${semesterToYearMap[i]})</option>`;
            }

            return `
                <div class="card" style="margin-bottom: 15px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                        
                        <div style="flex: 1; min-width: 250px;">
                            <h3 style="color: #f8fafc; margin: 0 0 5px 0;">${s.full_name || 'Unknown Student'}</h3>
                            <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 0.9em;">Reg: <strong>${s.registration_number || 'N/A'}</strong></p>
                            <p style="color: #10b981; margin: 0; font-size: 0.85em;">
                                Status: ${s.year || 'N/A'} - ${s.semester || 'N/A'} | Section: <strong style="color: #f59e0b;">${s.section || 'Unassigned'}</strong>
                            </p>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div style="display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; align-items: center; justify-content: flex-end;">
                                <label style="color: #cbd5e1; font-size: 0.8em; margin: 0;">Promote:</label>
                                <select id="promoteSem_${s.id}" style="padding: 6px; background: rgba(30,41,59,0.8); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; font-size: 0.85em;">
                                    ${semOptionsHTML}
                                </select>
                                <button onclick="window.promoteStudent('${s.id}')" style="padding: 6px 12px; background: #e11d48; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; font-weight:bold;">
                                    Save
                                </button>
                            </div>

                            <div style="display: flex; gap: 10px; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px; align-items: center; justify-content: flex-end;">
                                <label style="color: #cbd5e1; font-size: 0.8em; margin: 0;">Section:</label>
                                <select id="assignSec_${s.id}" style="padding: 6px; background: rgba(30,41,59,0.8); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; font-size: 0.85em;">
                                    <option value="Unassigned" ${!s.section || s.section === 'Unassigned' ? 'selected' : ''}>Unassigned</option>
                                    <option value="A" ${s.section === 'A' ? 'selected' : ''}>Sec A</option>
                                    <option value="B" ${s.section === 'B' ? 'selected' : ''}>Sec B</option>
                                    <option value="C" ${s.section === 'C' ? 'selected' : ''}>Sec C</option>
                                    <option value="D" ${s.section === 'D' ? 'selected' : ''}>Sec D</option>
                                </select>
                                <button onclick="window.updateSection('${s.id}')" style="padding: 6px 12px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85em; font-weight:bold;">
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    listDiv.innerHTML = finalHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input);
        const marginB = computedStyle.marginBottom;
        const marginT = computedStyle.marginTop;
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.display = 'block';
        wrapper.style.marginBottom = marginB;
        wrapper.style.marginTop = marginT;
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        input.style.paddingRight = '45px';
        input.style.width = '100%';
        input.style.marginBottom = '0'; 
        input.style.marginTop = '0'; 
        const toggleBtn = document.createElement('span');
        toggleBtn.innerHTML = eyeOpenSVG;
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '12px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.zIndex = '5';
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') { input.type = 'text'; toggleBtn.innerHTML = eyeClosedSVG; } 
            else { input.type = 'password'; toggleBtn.innerHTML = eyeOpenSVG; }
        });
        wrapper.appendChild(toggleBtn);
    });
});