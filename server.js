const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'student_db'
});

db.connect((err) => {
    if (err) {
        console.log('Database connection failed, using in-memory storage');
    } else {
        console.log('Connected to MySQL');
        // Create table if not exists
        db.query(`CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            course VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// In-memory storage as fallback
let students = [];
let nextId = 1;

// API Routes

// Get all students
app.get('/api/students', (req, res) => {
    if (db.state === 'connected') {
        db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
            if (err) {
                res.json(students);
            } else {
                res.json(results);
            }
        });
    } else {
        res.json(students);
    }
});

// Add new student
app.post('/api/students', (req, res) => {
    const { name, email, course } = req.body;
    
    if (!name || !email || !course) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (db.state === 'connected') {
        const sql = 'INSERT INTO students (name, email, course) VALUES (?, ?, ?)';
        db.query(sql, [name, email, course], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                id: result.insertId, 
                name, 
                email, 
                course, 
                message: 'Student added successfully' 
            });
        });
    } else {
        // In-memory fallback
        const newStudent = { id: nextId++, name, email, course };
        students.push(newStudent);
        res.json({ ...newStudent, message: 'Student added successfully (in-memory)' });
    }
});

// Delete student
app.delete('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (db.state === 'connected') {
        db.query('DELETE FROM students WHERE id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Student deleted successfully' });
        });
    } else {
        students = students.filter(s => s.id !== id);
        res.json({ message: 'Student deleted successfully (in-memory)' });
    }
});

// Serve HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Registration - Node.js & MySQL</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 30px 0;
        }
        .main-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            margin: 0 auto;
        }
        .card-header-custom {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px 15px 0 0;
        }
        .form-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .btn-custom {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 8px;
        }
        .btn-custom:hover {
            background: #764ba2;
        }
        .student-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-card">
            <div class="card-header-custom">
                <h3 class="mb-1">👨‍🎓 Student Registration System</h3>
                <p class="mb-0">Node.js, Express & MySQL</p>
            </div>
            
            <div class="p-4">
                <div class="form-card">
                    <h5 class="mb-3">➕ Register New Student</h5>
                    <form id="studentForm">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <input type="text" id="name" class="form-control" placeholder="Student Name" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <input type="email" id="email" class="form-control" placeholder="Email Address" required>
                            </div>
                            <div class="col-md-3 mb-3">
                                <select id="course" class="form-control" required>
                                    <option value="">Select Course</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="M.Tech">M.Tech">M.Tech</option>
                                    <option value="B.Sc">B.Sc</option>
                                    <option value="M.Sc">M.Sc</option>
                                </select>
                            </div>
                            <div class="col-md-1 mb-3">
                                <button type="submit" class="btn btn-custom w-100">Add</button>
                            </div>
                        </div>
                    </form>
                </div>
                
                <h5 class="mb-3">📋 Registered Students</h5>
                <div class="student-table">
                    <table class="table table-hover mb-0">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Course</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody id="studentList">
                            <tr><td colspan="5" class="text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function loadStudents() {
            fetch('/api/students')
                .then(res => res.json())
                .then(data => {
                    if (data.length === 0) {
                        $('#studentList').html('<tr><td colspan="5" class="text-center">No students registered yet</td></tr>');
                    } else {
                        let html = '';
                        data.forEach(student => {
                            html += '<tr>';
                            html += '<td>' + student.id + '</td>';
                            html += '<td>' + student.name + '</td>';
                            html += '<td>' + student.email + '</td>';
                            html += '<td>' + student.course + '</td>';
                            html += '<td><button class="btn btn-sm btn-danger" onclick="deleteStudent(' + student.id + ')">Delete</button></td>';
                            html += '</tr>';
                        });
                        $('#studentList').html(html);
                    }
                })
                .catch(err => console.error(err));
        }
        
        $('#studentForm').submit(function(e) {
            e.preventDefault();
            const student = {
                name: $('#name').val(),
                email: $('#email').val(),
                course: $('#course').val()
            };
            
            fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(student)
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                $('#studentForm')[0].reset();
                loadStudents();
            })
            .catch(err => alert('Error: ' + err));
        });
        
        function deleteStudent(id) {
            if (confirm('Are you sure?')) {
                fetch('/api/students/' + id, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    alert(data.message);
                    loadStudents();
                });
            }
        }
        
        $(document).ready(loadStudents);
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});