const API_URL = 'http://localhost:8080/api';

async function seed() {
    try {
        console.log('Logging in as admin...');
        let res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: 'admin', password: 'Admin@123'})
        });
        if (!res.ok) throw new Error('Admin login failed: ' + await res.text());
        let adminData = await res.json();
        let adminToken = adminData.token;
        
        console.log('Registering ce_teacher...');
        const teacherUser = 'ce_teacher_' + Date.now();
        res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'CE Teacher',
                username: teacherUser,
                email: teacherUser + '@example.com',
                password: 'Password@123',
                phone: '1234567890',
            })
        });
        if (!res.ok) throw new Error('Register failed: ' + await res.text());
        let teacherData = await res.json();
        let teacherId = teacherData.user.id;
        
        console.log('Promoting to TEACHER...');
        res = await fetch(`${API_URL}/admin/users/${teacherId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({role: 'TEACHER'})
        });
        if (!res.ok) throw new Error('Promote failed: ' + await res.text());
        
        console.log('Logging in as teacher...');
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: teacherUser, password: 'Password@123'})
        });
        if (!res.ok) throw new Error('Teacher login failed: ' + await res.text());
        let newTeacherData = await res.json();
        let teacherToken = newTeacherData.token;
        
        console.log('Creating 10 quizzes...');
        
        const quizzes = [
            { title: "Computer Networks Basics", desc: "Introduction to OSI and TCP/IP models." },
            { title: "Operating Systems Fundamentals", desc: "Processes, Threads, and Memory Management." },
            { title: "Data Structures & Algorithms", desc: "Arrays, Linked Lists, Trees, and Graphs." },
            { title: "Database Management Systems", desc: "SQL, Normalization, and ACID properties." },
            { title: "Computer Architecture", desc: "Pipelining, Cache Memory, and Instruction Sets." },
            { title: "Software Engineering Principles", desc: "SDLC, Agile methodologies, and Design Patterns." },
            { title: "Theory of Computation", desc: "Automata, Context-Free Grammars, and Turing Machines." },
            { title: "Compiler Design", desc: "Lexical Analysis, Parsing, and Code Generation." },
            { title: "Cryptography and Network Security", desc: "Encryption, Digital Signatures, and Firewalls." },
            { title: "Distributed Systems", desc: "Clocks, Consensus, and Distributed File Systems." }
        ];

        for (let i = 0; i < quizzes.length; i++) {
            let q = quizzes[i];
            let payload = {
                title: q.title,
                description: q.desc,
                category: "Computer Engineering",
                timeLimitMinutes: 15,
                difficulty: "MEDIUM",
                tags: "CE, Engineering, CS",
                questions: [
                    {
                        text: `Sample question for ${q.title}?`,
                        questionType: "MCQ",
                        options: ["Option A", "Option B", "Option C", "Option D"],
                        correctOption: "Option A",
                        marks: 2
                    },
                    {
                        text: `True or False: This is a fundamental concept in ${q.title}.`,
                        questionType: "TRUE_FALSE",
                        options: ["True", "False"],
                        correctOption: "True",
                        marks: 1
                    }
                ]
            };
            
            res = await fetch(`${API_URL}/quizzes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${teacherToken}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Quiz ${i+1} failed: ` + await res.text());
            let createdQuiz = await res.json();
            
            // Publish the quiz
            res = await fetch(`${API_URL}/quizzes/${createdQuiz.id}/publish`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${teacherToken}`
                }
            });
            if (!res.ok) throw new Error(`Quiz ${i+1} publish failed: ` + await res.text());
            
            console.log(`Created and published: ${q.title}`);
        }
        
        console.log('\n=============================================');
        console.log('SUCCESS!');
        console.log('Teacher Credentials:');
        console.log(`Username: ${teacherUser}`);
        console.log(`Password: Password@123`);
        console.log('=============================================');
    } catch (e) {
        console.error(e);
    }
}
seed();
