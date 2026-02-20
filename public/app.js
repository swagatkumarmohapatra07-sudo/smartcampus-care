// --- 1. FIREBASE SETUP & IMPORTS ---
// NEW: Added deleteDoc to the import list
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

// THE CUSTOM TOAST FUNCTION
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
    
    let icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span style="font-size: 1.2em;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
};

// --- HELPER: DYNAMIC BRANCH SELECTION ---
function updateBranchOptions(yearElementId, branchElementId, currentBranch = null) {
    const yearSelect = document.getElementById(yearElementId);
    const branchSelect = document.getElementById(branchElementId);
    
    if (!yearSelect || !branchSelect) return;

    const renderOptions = () => {
        if (yearSelect.value === '1st Year') {
            branchSelect.innerHTML = '<option value="Common 1st Year">Common 1st Year</option>';
        } else {
            branchSelect.innerHTML = `
                <option value="">Select Core Branch</option>
                <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                <option value="Data Science">Data Science</option>
                <option value="Electrical Communication Engineering">Electrical Communication Engineering</option>
                <option value="EE">EE</option>
                <option value="EEE">EEE</option>
                <option value="Civil">Civil</option>
                <option value="Mechanical">Mechanical</option>
            `;
        }
        if (currentBranch) branchSelect.value = currentBranch;
    };

    yearSelect.addEventListener('change', renderOptions);
    renderOptions(); 
}

// --- 3. STUDENT REGISTRATION ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    updateBranchOptions('year', 'branch'); 

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
                showToast(`Error: Registration Number '${regNumberInput}' is already registered!`, 'error');
                submitBtn.disabled = false;
                submitBtn.innerText = "Register Account";
                return; 
            }

            await addDoc(collection(db, "users"), {
                role: "Student",
                full_name: document.getElementById('fullName').value,
                course: document.getElementById('course').value,
                branch: document.getElementById('branch').value,
                section: document.getElementById('section').value,
                year: document.getElementById('year').value,             
                semester: document.getElementById('semester').value,     
                registration_number: regNumberInput,
                password: document.getElementById('password').value,
                profile_pic: "", 
                fee_status: "Unpaid" 
            });
            
            showToast('Registration Successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'student-login.html', 1500);
            
        } catch (error) {
            console.error("Registration Error: ", error);
            showToast('Error registering account.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerText = "Register Account";
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
    createAdminIfNotExists();

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        const q = query(collection(db, "users"), where("username", "==", username), where("password", "==", pass), where("role", "==", "Admin"));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            userData.id = querySnapshot.docs[0].id;
            localStorage.setItem('user', JSON.stringify(userData));
            window.location.href = 'admin.html';
        } else {
            document.getElementById('errorMsg').style.display = 'block';
        }
    });
}

async function createAdminIfNotExists() {
    const q = query(collection(db, "users"), where("role", "==", "Admin"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        await addDoc(collection(db, "users"), { role: "Admin", username: "admin1", password: "admin123" });
    }
}

// --- 6. STUDENT DASHBOARD MASTER LOGIC ---
if (user?.role === 'Student') {
    const welcomeText = document.getElementById('welcomeText');
    const academicInfo = document.getElementById('academicInfo'); 
    const headerAvatar = document.getElementById('headerAvatar');

    const avatarUrl = user.profile_pic || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    
    if (headerAvatar) headerAvatar.src = avatarUrl;
    if (academicInfo) academicInfo.innerText = `${user.course} in ${user.branch} | ${user.year || '1st Year'} (${user.semester || 'Semester 1'})`;

    if (welcomeText) welcomeText.innerText = `Welcome, ${user.full_name}!`;

    const timeGreeting = document.getElementById('timeGreeting');
    const welcomeName = document.getElementById('welcomeName');
    if (timeGreeting && welcomeName) {
        const hour = new Date().getHours();
        let greeting = "Good Evening";
        if (hour < 12) greeting = "Good Morning";
        else if (hour < 17) greeting = "Good Afternoon";
        
        timeGreeting.innerText = greeting;
        welcomeName.innerText = user.full_name;
    }

    if (document.getElementById('complaintForm')) initQueriesSystem();
    if (document.getElementById('paymentForm')) initFeeSystem();
    if (document.getElementById('profileYear')) initProfileSystem(avatarUrl);
}

// --- NEW: PROFILE & CLOUDINARY UPLOAD SYSTEM ---
function initProfileSystem(avatarUrl) {
    document.getElementById('profileNameDisplay').innerText = user.full_name;
    document.getElementById('profileRegDisplay').innerText = `Registration No: ${user.registration_number}`;
    document.getElementById('profileAvatarLarge').src = avatarUrl;
    
    document.getElementById('profileYear').value = user.year || '1st Year';
    document.getElementById('profileSemester').value = user.semester || 'Semester 1';
    
    updateBranchOptions('profileYear', 'profileBranch', user.branch);

    const profileImageInput = document.getElementById('profileImageInput');
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
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.secure_url) {
                const userRef = doc(db, "users", user.id);
                await updateDoc(userRef, { profile_pic: data.secure_url });
                
                user.profile_pic = data.secure_url;
                localStorage.setItem('user', JSON.stringify(user));
                
                document.getElementById('profileAvatarLarge').src = data.secure_url;
                const headerAvatar = document.getElementById('headerAvatar');
                if(headerAvatar) headerAvatar.src = data.secure_url;
                
                showToast('Profile picture updated!', 'success');
            } else {
                throw new Error("Cloudinary upload failed");
            }
        } catch(err) {
            console.error(err);
            showToast('Failed to upload image.', 'error');
        }
    });

    const updateProfileBtn = document.getElementById('updateProfileBtn');
    updateProfileBtn.addEventListener('click', async () => {
        const newYear = document.getElementById('profileYear').value;
        const newSem = document.getElementById('profileSemester').value;
        const newBranch = document.getElementById('profileBranch').value;

        if (!newBranch) {
            showToast('Please select a Core Branch.', 'warning');
            return;
        }

        updateProfileBtn.innerText = "Saving...";
        updateProfileBtn.disabled = true;

        try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, { year: newYear, semester: newSem, branch: newBranch });
            
            user.year = newYear;
            user.semester = newSem;
            user.branch = newBranch;
            localStorage.setItem('user', JSON.stringify(user));
            
            document.getElementById('academicInfo').innerText = `${user.course} in ${user.branch} | ${user.year} (${user.semester})`;
            showToast('Profile updated successfully!', 'success');
        } catch(err) {
            showToast('Error updating profile.', 'error');
        } finally {
            updateProfileBtn.innerText = "Save & Update Profile";
            updateProfileBtn.disabled = false;
        }
    });
}

// --- QUERIES SYSTEM ---
function initQueriesSystem() {
    const complaintForm = document.getElementById('complaintForm');
    const activeList = document.getElementById('activeComplaintsList');
    const resolvedList = document.getElementById('resolvedComplaintsList');

    // 1. Submit form
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const descInput = document.getElementById('description');
        const submitBtn = complaintForm.querySelector('button');

        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";
        
        await addDoc(collection(db, "complaints"), {
            student_id: user.id,
            student_details: `${user.full_name} | ${user.course} (${user.branch} - Sec ${user.section})`,
            reg_number: user.registration_number,
            description: descInput.value,
            status: "Pending",
            created_at: Date.now()
        });
        
        showToast('Query submitted successfully!', 'success');
        complaintForm.reset(); 
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Query";
    });

    // 2. NEW: Delete Query Function
    window.deleteQuery = async (queryId) => {
        if(confirm("Are you sure you want to delete this query?")) {
            try {
                await deleteDoc(doc(db, "complaints", queryId));
                showToast("Query deleted successfully!", "success");
            } catch(error) {
                console.error("Delete Error: ", error);
                showToast("Failed to delete query.", "error");
            }
        }
    };

    // 3. Listener
    const q = query(collection(db, "complaints"), where("student_id", "==", user.id));
    onSnapshot(q, (querySnapshot) => {
        let complaints = [];
        querySnapshot.forEach((doc) => complaints.push({ id: doc.id, ...doc.data() }));
        complaints.sort((a, b) => b.created_at - a.created_at);

        const activeComplaints = complaints.filter(c => c.status !== 'Resolved');
        const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');

        activeList.innerHTML = activeComplaints.length === 0 
            ? '<p style="color: #64748b; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">No active queries at the moment.</p>' 
            : activeComplaints.map((c, index) => `
                <div class="card" style="animation-delay: ${index * 0.1}s; position: relative;">
                    
                    ${c.status === 'Pending' ? `
                    <button onclick="window.deleteQuery('${c.id}')" style="position: absolute; top: 15px; right: 15px; background: rgba(225, 29, 72, 0.1); color: #fda4af; border: 1px solid rgba(225, 29, 72, 0.3); padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8em; transition: 0.3s; width: auto; margin: 0;" onmouseover="this.style.background='rgba(225, 29, 72, 0.3)'" onmouseout="this.style.background='rgba(225, 29, 72, 0.1)'">
                        🗑️ Delete
                    </button>
                    ` : ''}

                    <p style="padding-right: 80px;"><strong>Query:</strong> ${c.description}</p>
                    <div style="margin-top: 15px;">
                        <small>Status: <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span></small>
                        <small style="float: right; color: #94a3b8;">${new Date(c.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');

        resolvedList.innerHTML = resolvedComplaints.length === 0 
            ? '<p style="color: #64748b; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">No resolved queries yet.</p>' 
            : resolvedComplaints.map((c, index) => `
                <div class="card" style="animation-delay: ${index * 0.1}s; border-left: 4px solid #10b981; opacity: 0.8;">
                    <p><strong>Query:</strong> ${c.description}</p>
                    <div style="margin-top: 10px;">
                        <small>Status: <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span></small>
                        <small style="float: right; color: #94a3b8;">${new Date(c.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
    });
}

// --- FEES SYSTEM ---
function initFeeSystem() {
    const paymentForm = document.getElementById('paymentForm');
    const historyList = document.getElementById('paymentHistoryList');
    
    let yearMultiplier = 1;
    if (user.year === '2nd Year') yearMultiplier = 2;
    if (user.year === '3rd Year') yearMultiplier = 3;
    if (user.year === '4th Year') yearMultiplier = 4;
    
    const totalFeeAmount = 200000 * yearMultiplier; 
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
        btn.innerText = `Authorizing details via ${gateway}...`;
        btn.disabled = true;
        btn.style.opacity = "0.7";

        setTimeout(() => {
            btn.innerText = `Processing ${method} Payment...`;
            
            setTimeout(async () => {
                try {
                    const txnId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
                    
                    await addDoc(collection(db, "payments"), {
                        student_id: user.id,
                        full_name: user.full_name,
                        registration_number: user.registration_number,
                        course: user.course,
                        branch: user.branch,
                        section: user.section,
                        year: user.year || "N/A",           
                        semester: user.semester || "N/A",   
                        amount: amount,
                        gateway: gateway,
                        method: method,
                        transaction_id: txnId,
                        date: Date.now()
                    });

                    showToast(`Successfully paid ₹${amount.toLocaleString()} via ${gateway}!`, 'success');
                    paymentForm.reset();
                    upiUI.style.display = 'none';
                    cardUI.style.display = 'none';
                } catch (error) {
                    console.error("Payment failed:", error);
                    showToast("Payment failed. Please try again.", "error");
                } finally {
                    btn.innerText = "Process Secure Payment";
                    btn.disabled = false;
                    btn.style.opacity = "1";
                }
            }, 1500); 
        }, 1000); 
    });

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

        const totalOwedDisplay = document.getElementById('totalOwedDisplay');
        if(totalOwedDisplay) totalOwedDisplay.innerText = `₹${totalFeeAmount.toLocaleString()}`;
        
        document.getElementById('totalPaidDisplay').innerText = `₹${totalPaid.toLocaleString()}`;
        const remDisplay = document.getElementById('remainingBalanceDisplay');
        remDisplay.innerText = `₹${remainingBalance.toLocaleString()}`;
        
        const payAmountInput = document.getElementById('payAmount');
        const payFeeBtn = document.getElementById('payFeeBtn');
        
        if (remainingBalance <= 0) {
            remDisplay.style.color = "#10b981"; 
            payAmountInput.disabled = true;
            payAmountInput.placeholder = "All fees cleared!";
            payFeeBtn.disabled = true;
            payFeeBtn.innerText = "Course Paid in Full";
            payFeeBtn.style.background = "#10b981";
        } else {
            payAmountInput.max = remainingBalance;
            payAmountInput.placeholder = `Enter amount (Max: ₹${remainingBalance})`;
        }

        if (payments.length === 0) {
            historyList.innerHTML = '<p style="color: #64748b; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">No payment history found.</p>';
        } else {
            historyList.innerHTML = payments.map((p, index) => `
                <div class="card" style="animation-delay: ${index * 0.1}s; border-left: 4px solid #10b981; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                        <span style="color: #10b981; font-weight: 700; font-size: 1.2em;">₹${p.amount.toLocaleString()}</span>
                        <span class="badge Resolved">Success</span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 0.9em;"><strong>TXN ID:</strong> ${p.transaction_id} | <strong>Date:</strong> ${new Date(p.date).toLocaleString()}</p>
                    <p style="color: #cbd5e1; font-size: 0.9em;"><strong>Paid via:</strong> ${p.method} (${p.gateway})</p>
                    <button onclick="window.downloadReceipt('${p.id}')" style="margin-top: 15px; background: transparent; color: #10b981; border: 1px solid #10b981; width: 100%;">
                        ↓ Download Official Receipt
                    </button>
                </div>
            `).join('');
        }
    });
}

window.downloadReceipt = (paymentId) => {
    const txn = window.userPaymentHistory.find(p => p.id === paymentId);
    if (!txn) {
        showToast("Receipt data not found!", "error");
        return;
    }

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
    pdf.text(`Course Details: ${txn.course} (${txn.branch} - Sec ${txn.section}) | ${txn.year} (${txn.semester})`, 20, 111);
    pdf.text("--------------------------------------------------------------------------------------", 20, 120);
    
    pdf.setFontSize(16);
    pdf.setTextColor(16, 185, 129); 
    pdf.text(`Amount Paid: INR ${txn.amount.toLocaleString()}`, 20, 135);
    
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Status: SUCCESSFUL", 20, 145);

    pdf.save(`Receipt_${txn.transaction_id}.pdf`);
    showToast("Receipt downloaded successfully!", "success");
}

// --- 7. ADMIN DASHBOARD LOGIC ---
const adminComplaintsList = document.getElementById('adminComplaintsList');
if (adminComplaintsList && user?.role === 'Admin') {
    window.updateStatus = async (complaintId, newStatus) => {
        const complaintRef = doc(db, "complaints", complaintId);
        await updateDoc(complaintRef, { status: newStatus });
        showToast(`Query marked as ${newStatus}`, "success");
    };
    loadAdminData();
}

function loadAdminData() {
    onSnapshot(collection(db, "complaints"), (querySnapshot) => {
        let complaints = [];
        let resolvedCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            complaints.push({ id: doc.id, ...data });
            if (data.status === 'Resolved') resolvedCount++;
        });

        complaints.sort((a, b) => b.created_at - a.created_at);

        document.getElementById('totalCount').innerText = complaints.length;
        document.getElementById('resolvedCount').innerText = resolvedCount;

        adminComplaintsList.innerHTML = complaints.map((c, index) => `
            <div class="card" style="animation-delay: ${index * 0.1}s">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                    <span style="color: #6366f1; font-weight: 600;">Reg: ${c.reg_number}</span>
                    <span class="badge ${c.status.replace(' ', '-')}">${c.status}</span>
                </div>
                <p><strong>Student Info:</strong> ${c.student_details}</p>
                <p style="margin-top: 10px; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;"><strong>Issue:</strong> ${c.description}</p>
                
                ${c.status === 'Pending' ? `
                <button onclick="updateStatus('${c.id}', 'In Progress')" style="margin-top: 15px; width: 100%;">Mark 'In Progress'</button>
                ` : ''}

                ${c.status === 'In Progress' ? `
                <button onclick="updateStatus('${c.id}', 'Resolved')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin-top: 15px; width: 100%;">Mark 'Resolved'</button>
                ` : ''}
            </div>
        `).join('');
    });
}

// --- 8. NET BANKING REDIRECT LOGIC ---
if (window.location.pathname.includes('net-banking.html')) {
    const pendingTxn = JSON.parse(localStorage.getItem('pendingTxn'));
    
    if (!pendingTxn || !user) {
        window.location.href = 'student-fees.html';
    } else {
        document.getElementById('sbiAmount').innerText = pendingTxn.amount;
        
        document.getElementById('sbiLoginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('sbiPayBtn');
            btn.innerText = "Authorizing Transaction with SBI...";
            btn.disabled = true;

            setTimeout(async () => {
                const txnId = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
                
                await addDoc(collection(db, "payments"), {
                    student_id: user.id,
                    full_name: user.full_name,
                    registration_number: user.registration_number,
                    course: user.course,
                    branch: user.branch,
                    section: user.section,
                    year: user.year || "N/A",
                    semester: user.semester || "N/A",
                    amount: Number(pendingTxn.amount),
                    gateway: pendingTxn.gateway,
                    method: pendingTxn.method,
                    transaction_id: txnId,
                    date: Date.now()
                });
                
                localStorage.removeItem('pendingTxn');
                
                showToast("SBI Payment Successful! Returning to Portal...", "success");
                setTimeout(() => {
                    window.location.href = 'student-fees.html';
                }, 2500);

            }, 2000);
        });
    }
}
// --- 9. GLOBAL PASSWORD TOGGLE (AUTO-INJECTOR) ---
document.addEventListener('DOMContentLoaded', () => {
    // Premium SVG Icons (Matches your SaaS design)
    const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    // Find every single password input on the current page
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        // Capture original margins so we don't break your layout
        const computedStyle = window.getComputedStyle(input);
        const marginB = computedStyle.marginBottom;
        const marginT = computedStyle.marginTop;

        // Create a wrapper div
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.display = 'block';
        wrapper.style.marginBottom = marginB;
        wrapper.style.marginTop = marginT;

        // Wrap the input seamlessly
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        // Adjust input styles inside the wrapper so text doesn't hide behind the icon
        input.style.paddingRight = '45px';
        input.style.boxSizing = 'border-box';
        input.style.width = '100%';
        input.style.marginBottom = '0'; 
        input.style.marginTop = '0'; 
        
        // Create the eye toggle button
        const toggleBtn = document.createElement('span');
        toggleBtn.innerHTML = eyeOpenSVG;
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '12px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.justifyContent = 'center';
        toggleBtn.style.zIndex = '5';
        toggleBtn.style.transition = 'all 0.3s ease';
        toggleBtn.title = "Show Password";
        
        // Hover Effect (Turns Indigo)
        toggleBtn.addEventListener('mouseenter', () => toggleBtn.querySelector('svg').style.stroke = '#6366f1');
        toggleBtn.addEventListener('mouseleave', () => toggleBtn.querySelector('svg').style.stroke = '#94a3b8');

        // Click Logic (Switches Type & Icon)
        toggleBtn.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = eyeClosedSVG;
                toggleBtn.title = "Hide Password";
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = eyeOpenSVG;
                toggleBtn.title = "Show Password";
            }
            toggleBtn.querySelector('svg').style.stroke = '#6366f1'; // Keeps it highlighted after clicking
        });
        
        wrapper.appendChild(toggleBtn);
    });
});