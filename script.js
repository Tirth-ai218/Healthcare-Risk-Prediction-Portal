let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'historyPage') loadHistory();
}

// LOGIN
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById('loginError').textContent = data.error;
        } else {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showPage('landingPage');
        }
    })
    .catch(() => document.getElementById('loginError').textContent = 'Server error');
});

// SIGNUP
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
        document.getElementById('signupError').textContent = 'Passwords do not match';
        return;
    }

    fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            document.getElementById('signupError').textContent = data.error;
        } else {
            const msgEl = document.getElementById('signupError');
            msgEl.textContent = 'Account created successfully! Please login.';
            msgEl.className = 'success';
            setTimeout(() => {
                document.getElementById('signupForm').reset();
                showPage('loginPage');
            }, 1500);
        }
    })
    .catch(() => document.getElementById('signupError').textContent = 'Server error');
});

// HEALTH FORM SUBMISSION
document.getElementById('healthForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentUser) return alert('Please login first.');

    const formData = {
        userId: currentUser.id,
        age: parseInt(document.getElementById('age').value),
        gender: document.getElementById('gender').value,
        height: parseInt(document.getElementById('height').value),
        weight: parseInt(document.getElementById('weight').value),
        bloodPressure: document.getElementById('bloodPressure').value,
        bloodSugar: parseInt(document.getElementById('bloodSugar').value),
        cholesterol: parseInt(document.getElementById('cholesterol').value),
        heartRate: parseInt(document.getElementById('heartRate').value),
        smoking: document.getElementById('smoking').value,
        exercise: document.getElementById('exercise').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        medications: document.getElementById('medications').value,
        timestamp: new Date().toISOString()
    };

    const risk = calculateHealthRisk(formData);
    formData.riskLevel = risk.level;
    formData.riskScore = risk.score;
    formData.recommendations = risk.recommendations;

    fetch('http://localhost:3000/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) alert('Error saving assessment: ' + data.error);
        else {
            displayRiskResults(risk);
            showPage('predictionPage');
            document.getElementById('healthForm').reset();
        }
    })
    .catch(err => {
        console.error(err);
        alert('Server error while saving assessment');
    });
});

// CALCULATE HEALTH RISK
function calculateHealthRisk(data) {
    let score = 0;
    const recommendations = [];
    const bmi = data.weight / ((data.height / 100) ** 2);

    if (bmi < 18.5) { score += 10; recommendations.push('Underweight. Consider nutrition guidance.'); }
    else if (bmi >= 25 && bmi < 30) { score += 20; recommendations.push('Overweight. Regular exercise recommended.'); }
    else if (bmi >= 30) { score += 35; recommendations.push('Obese. Consult healthcare provider.'); }

    const [systolic] = data.bloodPressure.split('/').map(Number);
    if (systolic >= 140) { score += 30; recommendations.push('High BP. Monitor regularly.'); }
    else if (systolic >= 130) { score += 20; recommendations.push('Elevated BP. Reduce salt intake.'); }

    if (data.bloodSugar >= 126) { score += 35; recommendations.push('High blood sugar. Diabetes screening recommended.'); }
    else if (data.bloodSugar >= 100) { score += 20; recommendations.push('Pre-diabetic. Monitor diet.'); }

    if (data.cholesterol >= 240) { score += 30; recommendations.push('High cholesterol. Reduce fats.'); }
    else if (data.cholesterol >= 200) { score += 15; recommendations.push('Borderline cholesterol. Exercise regularly.'); }

    if (data.smoking === 'current') { score += 40; recommendations.push('Smoking increases health risks. Consider quitting.'); }
    else if (data.smoking === 'former') { score += 10; recommendations.push('Quit smoking. Stay smoke-free.'); }

    if (data.exercise === 'none') { score += 25; recommendations.push('Sedentary lifestyle. Aim for daily exercise.'); }
    else if (data.exercise === 'occasional') { score += 10; recommendations.push('Increase exercise frequency.'); }

    if (data.age > 60) { score += 15; recommendations.push('Regular health check-ups recommended.'); }

    if (data.heartRate > 100 || data.heartRate < 60) { score += 15; recommendations.push('Irregular heart rate. Consider cardiac evaluation.'); }

    let level = score < 50 ? 'low' : score < 100 ? 'medium' : 'high';
    if (!recommendations.length) recommendations.push('Your health metrics look good! Maintain healthy lifestyle.');

    return { level, score, recommendations, bmi: bmi.toFixed(1) };
}

// DISPLAY RISK RESULTS
function displayRiskResults(risk) {
    const resultDiv = document.getElementById('riskResult');
    const recsDiv = document.getElementById('recommendations');
    let riskClass = risk.level === 'low' ? 'risk-low' : risk.level === 'medium' ? 'risk-medium' : 'risk-high';
    let riskText = risk.level.charAt(0).toUpperCase() + risk.level.slice(1) + ' Risk';
    let riskMessage = risk.level === 'low' ? 'Low risk. Keep it up!' :
                      risk.level === 'medium' ? 'Medium risk. Follow recommendations.' :
                      'High risk. Consult healthcare provider.';

    resultDiv.innerHTML = `
        <div class="risk-result ${riskClass}">
            <h3>${riskText}</h3>
            <p>Risk Score: ${risk.score}/200</p>
            <p>BMI: ${risk.bmi}</p>
            <p style="margin-top:15px;">${riskMessage}</p>
        </div>
    `;

    recsDiv.innerHTML = `<h3>Recommendations:</h3><ul style="text-align:left; margin-left:20px;">` +
        risk.recommendations.map(r => `<li style="margin:10px 0;color:#555;">${r}</li>`).join('') +
        '</ul>';
}

// LOAD HISTORY
function loadHistory() {
    if (!currentUser) return;
    const historyList = document.getElementById('historyList');

    fetch(`http://localhost:3000/api/assessments/user/${currentUser.id}`)
    .then(res => res.json())
    .then(data => {
        if (!data.success || !data.assessments) {
            historyList.innerHTML = '<p style="text-align:center;color:red;">Error loading history.</p>';
            return;
        }

        const userAssessments = data.assessments.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        if (!userAssessments.length) {
            historyList.innerHTML = '<p style="text-align:center;color:#666;padding:40px;">No history found.</p>';
            return;
        }

        historyList.innerHTML = userAssessments.map(a => {
            const date = new Date(a.created_at).toLocaleString();
            const riskColor = a.risk_level === 'low' ? '#28a745' : a.risk_level === 'medium' ? '#ffc107' : '#dc3545';
            const bmi = (a.weight / ((a.height / 100) ** 2)).toFixed(1);
            return `
                <div class="history-item">
                    <h3>Assessment - ${date}</h3>
                    <p><strong>Risk Level:</strong> <span style="color:${riskColor}">${a.risk_level.charAt(0).toUpperCase() + a.risk_level.slice(1)} Risk</span></p>
                    <p><strong>Risk Score:</strong> ${a.risk_score}/200</p>
                    <p><strong>Age:</strong> ${a.age} | <strong>BMI:</strong> ${bmi}</p>
                    <p><strong>Blood Pressure:</strong> ${a.blood_pressure} | <strong>Blood Sugar:</strong> ${a.blood_sugar} mg/dL</p>
                    <p><strong>Cholesterol:</strong> ${a.cholesterol} mg/dL | <strong>Heart Rate:</strong> ${a.heart_rate} bpm</p>
                </div>`;
        }).join('');
    })
    .catch(err => {
        console.error(err);
        historyList.innerHTML = '<p style="text-align:center;color:red;">Server error while loading history.</p>';
    });
}

// LOGOUT
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginForm').reset();
    showPage('loginPage');
}

// INIT
if (currentUser) showPage('landingPage');
else showPage('loginPage');