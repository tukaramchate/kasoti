# Script to create 10 programming quizzes, each with 10 questions
# Requires the backend to be running on localhost:8080

$API_URL = "http://localhost:8080"

# --- Login as teacher to get JWT token ---
Write-Host "=== Programming Quiz Creator ===" -ForegroundColor Cyan
$username = Read-Host "Enter teacher username"
$password = Read-Host "Enter teacher password"

Write-Host "`nLogging in as '$username'..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
        username = $username
        password = $password
    } | ConvertTo-Json)
    $token = $loginResponse.token
    Write-Host "Login successful!" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the backend is running and credentials are correct." -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json; charset=utf-8"
}

# --- Define 10 Programming Quizzes ---
$quizzes = @(
    # Quiz 1: Java Fundamentals
    @{
        title = "Java Fundamentals"
        description = "Test your knowledge of Java basics including data types, operators, control flow, and OOP concepts."
        category = "Programming"
        difficulty = "EASY"
        tags = "java,fundamentals,basics,oop"
        timeLimitMinutes = 15
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which of the following is a valid Java data type?"; questionType = "MCQ"; options = @("int", "integer", "num", "number"); correctOption = "int"; marks = 1 },
            @{ text = "What is the size of an int variable in Java?"; questionType = "MCQ"; options = @("16 bits", "32 bits", "64 bits", "8 bits"); correctOption = "32 bits"; marks = 1 },
            @{ text = "Which keyword is used to define a class in Java?"; questionType = "MCQ"; options = @("class", "Class", "define", "struct"); correctOption = "class"; marks = 1 },
            @{ text = "Java is a platform-independent language."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "Which method is the entry point of a Java application?"; questionType = "MCQ"; options = @("main()", "start()", "init()", "run()"); correctOption = "main()"; marks = 1 },
            @{ text = "What does JVM stand for?"; questionType = "MCQ"; options = @("Java Virtual Machine", "Java Variable Method", "Java Visual Manager", "Java Version Module"); correctOption = "Java Virtual Machine"; marks = 1 },
            @{ text = "Which of these is NOT an access modifier in Java?"; questionType = "MCQ"; options = @("friend", "public", "private", "protected"); correctOption = "friend"; marks = 1 },
            @{ text = "What is the default value of an int variable in Java?"; questionType = "MCQ"; options = @("0", "1", "null", "undefined"); correctOption = "0"; marks = 1 },
            @{ text = "Which operator is used for string concatenation in Java?"; questionType = "MCQ"; options = @("+", "&", ".", "++"); correctOption = "+"; marks = 1 },
            @{ text = "Java supports multiple inheritance through classes."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 }
        )
    },

    # Quiz 2: Python Basics
    @{
        title = "Python Basics"
        description = "Assess your understanding of Python fundamentals including syntax, data types, and built-in functions."
        category = "Programming"
        difficulty = "EASY"
        tags = "python,basics,syntax,beginner"
        timeLimitMinutes = 15
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which symbol is used for comments in Python?"; questionType = "MCQ"; options = @("#", "//", "/*", "--"); correctOption = "#"; marks = 1 },
            @{ text = "What is the output of print(type(3.14))?"; questionType = "MCQ"; options = @("<class 'float'>", "<class 'int'>", "<class 'double'>", "<class 'decimal'>"); correctOption = "<class 'float'>"; marks = 1 },
            @{ text = "Which keyword is used to define a function in Python?"; questionType = "MCQ"; options = @("def", "function", "func", "define"); correctOption = "def"; marks = 1 },
            @{ text = "Python uses indentation to define code blocks."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "What does len() function do in Python?"; questionType = "MCQ"; options = @("Returns the length of an object", "Returns the last element", "Converts to integer", "Sorts a list"); correctOption = "Returns the length of an object"; marks = 1 },
            @{ text = "Which of the following is a mutable data type in Python?"; questionType = "MCQ"; options = @("list", "tuple", "string", "frozenset"); correctOption = "list"; marks = 1 },
            @{ text = "What is the correct way to create a dictionary in Python?"; questionType = "MCQ"; options = @("{key: value}", "[key: value]", "(key: value)", "<key: value>"); correctOption = "{key: value}"; marks = 1 },
            @{ text = "Which method adds an element to the end of a list?"; questionType = "MCQ"; options = @("append()", "add()", "push()", "insert()"); correctOption = "append()"; marks = 1 },
            @{ text = "What does the 'pass' statement do in Python?"; questionType = "MCQ"; options = @("Does nothing (placeholder)", "Exits the loop", "Skips iteration", "Raises an error"); correctOption = "Does nothing (placeholder)"; marks = 1 },
            @{ text = "Python is a statically typed language."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 }
        )
    },

    # Quiz 3: JavaScript Essentials
    @{
        title = "JavaScript Essentials"
        description = "Test your knowledge of JavaScript core concepts including ES6 features, DOM, and asynchronous programming."
        category = "Programming"
        difficulty = "MEDIUM"
        tags = "javascript,es6,web,frontend"
        timeLimitMinutes = 20
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which keyword declares a block-scoped variable in JavaScript?"; questionType = "MCQ"; options = @("let", "var", "define", "dim"); correctOption = "let"; marks = 1 },
            @{ text = "What does '===' operator check in JavaScript?"; questionType = "MCQ"; options = @("Value and type equality", "Value equality only", "Reference equality", "Type equality only"); correctOption = "Value and type equality"; marks = 1 },
            @{ text = "Which method converts a JSON string to a JavaScript object?"; questionType = "MCQ"; options = @("JSON.parse()", "JSON.stringify()", "JSON.convert()", "JSON.toObject()"); correctOption = "JSON.parse()"; marks = 1 },
            @{ text = "Arrow functions have their own 'this' context."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 },
            @{ text = "What is the output of typeof null in JavaScript?"; questionType = "MCQ"; options = @("object", "null", "undefined", "boolean"); correctOption = "object"; marks = 1 },
            @{ text = "Which array method creates a new array with filtered elements?"; questionType = "MCQ"; options = @("filter()", "find()", "slice()", "splice()"); correctOption = "filter()"; marks = 1 },
            @{ text = "What does the 'async' keyword do?"; questionType = "MCQ"; options = @("Makes a function return a Promise", "Pauses execution", "Creates a new thread", "Blocks the event loop"); correctOption = "Makes a function return a Promise"; marks = 1 },
            @{ text = "Which method is used to select an element by ID in the DOM?"; questionType = "MCQ"; options = @("getElementById()", "querySelector()", "getElement()", "findById()"); correctOption = "getElementById()"; marks = 1 },
            @{ text = "What is the purpose of the spread operator (...)?"; questionType = "MCQ"; options = @("Expands an iterable into individual elements", "Creates a new array", "Deletes properties", "Merges functions"); correctOption = "Expands an iterable into individual elements"; marks = 1 },
            @{ text = "JavaScript is a single-threaded language."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 4: SQL & Databases
    @{
        title = "SQL and Database Concepts"
        description = "Evaluate your understanding of SQL queries, database design, and relational database concepts."
        category = "Programming"
        difficulty = "MEDIUM"
        tags = "sql,database,queries,relational"
        timeLimitMinutes = 20
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which SQL statement is used to retrieve data from a database?"; questionType = "MCQ"; options = @("SELECT", "GET", "FETCH", "RETRIEVE"); correctOption = "SELECT"; marks = 1 },
            @{ text = "What does the WHERE clause do in SQL?"; questionType = "MCQ"; options = @("Filters rows based on a condition", "Sorts the results", "Groups the results", "Joins two tables"); correctOption = "Filters rows based on a condition"; marks = 1 },
            @{ text = "Which SQL keyword is used to sort results?"; questionType = "MCQ"; options = @("ORDER BY", "SORT BY", "ARRANGE BY", "GROUP BY"); correctOption = "ORDER BY"; marks = 1 },
            @{ text = "A PRIMARY KEY can contain NULL values."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 },
            @{ text = "Which JOIN returns all rows from both tables?"; questionType = "MCQ"; options = @("FULL OUTER JOIN", "INNER JOIN", "LEFT JOIN", "CROSS JOIN"); correctOption = "FULL OUTER JOIN"; marks = 1 },
            @{ text = "What does the GROUP BY clause do?"; questionType = "MCQ"; options = @("Groups rows that have the same values", "Filters grouped results", "Orders the result set", "Limits the number of rows"); correctOption = "Groups rows that have the same values"; marks = 1 },
            @{ text = "Which SQL function returns the number of rows?"; questionType = "MCQ"; options = @("COUNT()", "SUM()", "TOTAL()", "NUM()"); correctOption = "COUNT()"; marks = 1 },
            @{ text = "What is normalization in databases?"; questionType = "MCQ"; options = @("Organizing data to reduce redundancy", "Encrypting data", "Backing up data", "Indexing tables"); correctOption = "Organizing data to reduce redundancy"; marks = 1 },
            @{ text = "Which statement is used to modify existing data in a table?"; questionType = "MCQ"; options = @("UPDATE", "MODIFY", "ALTER", "CHANGE"); correctOption = "UPDATE"; marks = 1 },
            @{ text = "An index speeds up data retrieval in a database."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 5: Data Structures
    @{
        title = "Data Structures"
        description = "Test your knowledge of fundamental data structures including arrays, linked lists, trees, and more."
        category = "Programming"
        difficulty = "MEDIUM"
        tags = "data-structures,algorithms,computer-science"
        timeLimitMinutes = 20
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "What is the time complexity of accessing an element in an array by index?"; questionType = "MCQ"; options = @("O(1)", "O(n)", "O(log n)", "O(n^2)"); correctOption = "O(1)"; marks = 1 },
            @{ text = "Which data structure follows FIFO (First In First Out)?"; questionType = "MCQ"; options = @("Queue", "Stack", "Array", "Tree"); correctOption = "Queue"; marks = 1 },
            @{ text = "What is the maximum number of children a binary tree node can have?"; questionType = "MCQ"; options = @("2", "1", "3", "Unlimited"); correctOption = "2"; marks = 1 },
            @{ text = "A stack follows LIFO (Last In First Out) principle."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "Which data structure is best for implementing recursion?"; questionType = "MCQ"; options = @("Stack", "Queue", "Array", "Linked List"); correctOption = "Stack"; marks = 1 },
            @{ text = "What is the worst-case time complexity of searching in a binary search tree?"; questionType = "MCQ"; options = @("O(n)", "O(log n)", "O(1)", "O(n log n)"); correctOption = "O(n)"; marks = 1 },
            @{ text = "In a singly linked list, each node has how many pointers?"; questionType = "MCQ"; options = @("1", "2", "3", "0"); correctOption = "1"; marks = 1 },
            @{ text = "Which data structure uses a hash function for storing data?"; questionType = "MCQ"; options = @("Hash Table", "Binary Tree", "Stack", "Queue"); correctOption = "Hash Table"; marks = 1 },
            @{ text = "What is the time complexity of inserting at the beginning of a linked list?"; questionType = "MCQ"; options = @("O(1)", "O(n)", "O(log n)", "O(n^2)"); correctOption = "O(1)"; marks = 1 },
            @{ text = "A graph can have cycles."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 6: C Programming
    @{
        title = "C Programming"
        description = "Assess your knowledge of C programming including pointers, memory management, and standard library functions."
        category = "Programming"
        difficulty = "MEDIUM"
        tags = "c,programming,pointers,memory"
        timeLimitMinutes = 20
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which header file is required for printf() in C?"; questionType = "MCQ"; options = @("stdio.h", "stdlib.h", "string.h", "conio.h"); correctOption = "stdio.h"; marks = 1 },
            @{ text = "What does the '*' operator do when used with a pointer?"; questionType = "MCQ"; options = @("Dereferences the pointer", "Multiplies values", "Declares a pointer", "Gets the address"); correctOption = "Dereferences the pointer"; marks = 1 },
            @{ text = "Which function is used to dynamically allocate memory in C?"; questionType = "MCQ"; options = @("malloc()", "alloc()", "new()", "create()"); correctOption = "malloc()"; marks = 1 },
            @{ text = "C supports object-oriented programming natively."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 },
            @{ text = "What is the size of a char in C?"; questionType = "MCQ"; options = @("1 byte", "2 bytes", "4 bytes", "8 bytes"); correctOption = "1 byte"; marks = 1 },
            @{ text = "Which keyword is used to prevent modification of a variable in C?"; questionType = "MCQ"; options = @("const", "final", "static", "readonly"); correctOption = "const"; marks = 1 },
            @{ text = "What does the 'sizeof' operator return?"; questionType = "MCQ"; options = @("Size of a data type in bytes", "Number of elements", "Memory address", "Data type name"); correctOption = "Size of a data type in bytes"; marks = 1 },
            @{ text = "Which loop is guaranteed to execute at least once?"; questionType = "MCQ"; options = @("do-while", "for", "while", "foreach"); correctOption = "do-while"; marks = 1 },
            @{ text = "What is a segmentation fault?"; questionType = "MCQ"; options = @("Accessing memory that is not allowed", "Dividing by zero", "Stack overflow", "Syntax error"); correctOption = "Accessing memory that is not allowed"; marks = 1 },
            @{ text = "Arrays in C are zero-indexed."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 7: HTML & CSS
    @{
        title = "HTML and CSS"
        description = "Test your understanding of HTML5 elements, CSS styling, flexbox, and responsive design concepts."
        category = "Programming"
        difficulty = "EASY"
        tags = "html,css,web,frontend,responsive"
        timeLimitMinutes = 15
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "What does HTML stand for?"; questionType = "MCQ"; options = @("HyperText Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"); correctOption = "HyperText Markup Language"; marks = 1 },
            @{ text = "Which CSS property is used to change text color?"; questionType = "MCQ"; options = @("color", "text-color", "font-color", "foreground"); correctOption = "color"; marks = 1 },
            @{ text = "Which HTML tag is used for the largest heading?"; questionType = "MCQ"; options = @("<h1>", "<h6>", "<heading>", "<head>"); correctOption = "<h1>"; marks = 1 },
            @{ text = "CSS stands for Cascading Style Sheets."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "Which CSS display value makes elements flex containers?"; questionType = "MCQ"; options = @("flex", "block", "inline", "grid"); correctOption = "flex"; marks = 1 },
            @{ text = "Which HTML element is used to define an unordered list?"; questionType = "MCQ"; options = @("<ul>", "<ol>", "<li>", "<list>"); correctOption = "<ul>"; marks = 1 },
            @{ text = "What does the CSS 'position: absolute' do?"; questionType = "MCQ"; options = @("Positions relative to nearest positioned ancestor", "Positions relative to viewport", "Keeps in normal flow", "Makes element sticky"); correctOption = "Positions relative to nearest positioned ancestor"; marks = 1 },
            @{ text = "Which CSS unit is relative to the font-size of the element?"; questionType = "MCQ"; options = @("em", "px", "cm", "pt"); correctOption = "em"; marks = 1 },
            @{ text = "Which HTML tag is used to embed JavaScript?"; questionType = "MCQ"; options = @("<script>", "<js>", "<javascript>", "<code>"); correctOption = "<script>"; marks = 1 },
            @{ text = "The <div> element is an inline element by default."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 }
        )
    },

    # Quiz 8: React.js
    @{
        title = "React.js Concepts"
        description = "Evaluate your understanding of React.js including components, hooks, state management, and JSX."
        category = "Programming"
        difficulty = "HARD"
        tags = "react,javascript,frontend,hooks,components"
        timeLimitMinutes = 25
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "What hook is used to manage state in a functional component?"; questionType = "MCQ"; options = @("useState", "useEffect", "useReducer", "useContext"); correctOption = "useState"; marks = 1 },
            @{ text = "What does JSX stand for?"; questionType = "MCQ"; options = @("JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Extension"); correctOption = "JavaScript XML"; marks = 1 },
            @{ text = "Which hook is used for side effects in React?"; questionType = "MCQ"; options = @("useEffect", "useState", "useMemo", "useCallback"); correctOption = "useEffect"; marks = 1 },
            @{ text = "React components must return a single root element."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "What is the Virtual DOM in React?"; questionType = "MCQ"; options = @("A lightweight copy of the actual DOM", "The browser's DOM", "A database", "A CSS framework"); correctOption = "A lightweight copy of the actual DOM"; marks = 1 },
            @{ text = "Which method is used to pass data from parent to child component?"; questionType = "MCQ"; options = @("Props", "State", "Context", "Redux"); correctOption = "Props"; marks = 1 },
            @{ text = "What does useCallback hook do?"; questionType = "MCQ"; options = @("Memoizes a callback function", "Creates a new callback", "Handles events", "Manages state"); correctOption = "Memoizes a callback function"; marks = 1 },
            @{ text = "Which hook would you use to access context values?"; questionType = "MCQ"; options = @("useContext", "useState", "useReducer", "useRef"); correctOption = "useContext"; marks = 1 },
            @{ text = "What is the purpose of the key prop in lists?"; questionType = "MCQ"; options = @("Helps React identify which items changed", "Styles list items", "Sorts the list", "Filters items"); correctOption = "Helps React identify which items changed"; marks = 1 },
            @{ text = "React uses one-way data binding by default."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 9: Git & Version Control
    @{
        title = "Git and Version Control"
        description = "Test your knowledge of Git commands, branching strategies, and version control best practices."
        category = "Programming"
        difficulty = "EASY"
        tags = "git,version-control,github,branching"
        timeLimitMinutes = 15
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which command initializes a new Git repository?"; questionType = "MCQ"; options = @("git init", "git start", "git create", "git new"); correctOption = "git init"; marks = 1 },
            @{ text = "What does 'git clone' do?"; questionType = "MCQ"; options = @("Creates a copy of a remote repository", "Deletes a repository", "Creates a new branch", "Merges branches"); correctOption = "Creates a copy of a remote repository"; marks = 1 },
            @{ text = "Which command stages changes for commit?"; questionType = "MCQ"; options = @("git add", "git stage", "git commit", "git push"); correctOption = "git add"; marks = 1 },
            @{ text = "Git is a distributed version control system."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 },
            @{ text = "Which command shows the commit history?"; questionType = "MCQ"; options = @("git log", "git history", "git show", "git status"); correctOption = "git log"; marks = 1 },
            @{ text = "What does 'git pull' do?"; questionType = "MCQ"; options = @("Fetches and merges changes from remote", "Pushes local changes", "Creates a pull request", "Deletes a branch"); correctOption = "Fetches and merges changes from remote"; marks = 1 },
            @{ text = "Which command creates a new branch?"; questionType = "MCQ"; options = @("git branch <name>", "git new <name>", "git create <name>", "git fork <name>"); correctOption = "git branch <name>"; marks = 1 },
            @{ text = "What is a merge conflict?"; questionType = "MCQ"; options = @("When two branches have competing changes", "When a branch is deleted", "When a commit fails", "When the repository is corrupted"); correctOption = "When two branches have competing changes"; marks = 1 },
            @{ text = "Which file tells Git which files to ignore?"; questionType = "MCQ"; options = @(".gitignore", ".gitconfig", ".gitexclude", ".gitskip"); correctOption = ".gitignore"; marks = 1 },
            @{ text = "A commit in Git is immutable once created."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    },

    # Quiz 10: Object-Oriented Programming
    @{
        title = "Object-Oriented Programming"
        description = "Assess your understanding of OOP principles including encapsulation, inheritance, polymorphism, and abstraction."
        category = "Programming"
        difficulty = "MEDIUM"
        tags = "oop,design,inheritance,polymorphism"
        timeLimitMinutes = 20
        negativeMarking = $false
        shuffleQuestions = $true
        shuffleOptions = $true
        passPercentage = 50
        questions = @(
            @{ text = "Which OOP principle hides internal implementation details?"; questionType = "MCQ"; options = @("Encapsulation", "Inheritance", "Polymorphism", "Abstraction"); correctOption = "Encapsulation"; marks = 1 },
            @{ text = "What is inheritance in OOP?"; questionType = "MCQ"; options = @("A class acquiring properties of another class", "Hiding data", "Multiple forms of a method", "Creating objects"); correctOption = "A class acquiring properties of another class"; marks = 1 },
            @{ text = "What is method overloading?"; questionType = "MCQ"; options = @("Same method name with different parameters", "Overriding a parent method", "Creating multiple classes", "Deleting a method"); correctOption = "Same method name with different parameters"; marks = 1 },
            @{ text = "An abstract class can be instantiated directly."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "False"; marks = 1 },
            @{ text = "What is polymorphism?"; questionType = "MCQ"; options = @("Ability to take many forms", "Data hiding", "Code reuse", "Memory management"); correctOption = "Ability to take many forms"; marks = 1 },
            @{ text = "Which relationship does inheritance represent?"; questionType = "MCQ"; options = @("IS-A", "HAS-A", "USES-A", "PART-OF"); correctOption = "IS-A"; marks = 1 },
            @{ text = "What is the purpose of a constructor?"; questionType = "MCQ"; options = @("Initialize an object's state", "Destroy an object", "Define methods", "Create interfaces"); correctOption = "Initialize an object's state"; marks = 1 },
            @{ text = "Which keyword is used to implement an interface in Java?"; questionType = "MCQ"; options = @("implements", "extends", "interface", "uses"); correctOption = "implements"; marks = 1 },
            @{ text = "What is the difference between abstract class and interface?"; questionType = "MCQ"; options = @("Abstract class can have implementations, interface cannot (pre-Java 8)", "They are the same", "Interface can have constructors", "Abstract class cannot have fields"); correctOption = "Abstract class can have implementations, interface cannot (pre-Java 8)"; marks = 1 },
            @{ text = "Composition represents a HAS-A relationship."; questionType = "TRUE_FALSE"; options = @("True", "False"); correctOption = "True"; marks = 1 }
        )
    }
)

# --- Create each quiz via the API ---
$successCount = 0
$failCount = 0

for ($i = 0; $i -lt $quizzes.Count; $i++) {
    $quiz = $quizzes[$i]
    $quizNum = $i + 1
    Write-Host "`n[$quizNum/10] Creating quiz: '$($quiz.title)'..." -ForegroundColor Yellow

    try {
        $body = $quiz | ConvertTo-Json -Depth 5
        $response = Invoke-RestMethod -Uri "$API_URL/api/quizzes" -Method POST -Headers $headers -Body $body
        Write-Host "  Created successfully! (ID: $($response.id))" -ForegroundColor Green
        $successCount++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd()
        } catch {}
        Write-Host "  Failed! Status: $statusCode - $errorBody" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Successfully created: $successCount quizzes" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount quizzes" -ForegroundColor Red
}
Write-Host "Done!" -ForegroundColor Cyan
