#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

// File JSON nằm ở thư mục hiện tại (nơi chạy lệnh)
const FILE = path.join(process.cwd(), 'task.json')
const STATUSES = ['todo', 'in-progress', 'done']

// ---------- Đọc / ghi file ----------
function loadTasks() {
    if (!fs.existsSync(FILE)) {
        fs.writeFileSync(FILE, '[]')
        return []
    }
    const raw = fs.readFileSync(FILE, 'utf-8').trim()
    if (raw === '') return []
    let data
    try {
        data = JSON.parse(raw)
    } catch (err) {
        fail('task.json is not valid JSON: ' + err.message)
    }
    if (!Array.isArray(data)) fail('task.json must contain an array of tasks')
    return data
}

function saveTasks(tasks) {
    fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2))
}

// ---------- Tiện ích ----------
function fail(msg) {
    console.error('Error: ' + msg)
    process.exit(1)
}

function parseId(value) {
    if (value === undefined) fail('missing task ID')
    if (!/^\d+$/.test(value)) fail('task ID must be a positive integer, got "' + value + '"')
    return Number(value)
}

function findTask(tasks, id) {
    const task = tasks.find(t => t.id === id)
    if (!task) fail('task with ID ' + id + ' not found')
    return task
}

function requireDescription(desc) {
    if (desc === undefined || desc.trim() === '') fail('description cannot be empty')
    return desc.trim()
}

function printTask(task) {
    console.log('id          : ' + task.id)
    console.log('description : ' + task.description)
    console.log('status      : ' + task.status)
    console.log('createdAt   : ' + task.createdAt)
    console.log('updatedAt   : ' + task.updatedAt)
    console.log('------------------------------')
}

function showHelp() {
    console.log(`Usage:
  task-cli add "<description>"
  task-cli update <id> "<description>"
  task-cli delete <id>
  task-cli mark-in-progress <id>
  task-cli mark-done <id>
  task-cli mark-todo <id>
  task-cli list [todo|in-progress|done]`)
}

// ---------- Các lệnh ----------
function add(desc) {
    const description = requireDescription(desc)
    const tasks = loadTasks()
    const ids = tasks.map(t => t.id)
    const newId = ids.length === 0 ? 1 : Math.max(...ids) + 1
    const now = new Date().toISOString()

    tasks.push({
        id: newId,
        description: description,
        status: 'todo',
        createdAt: now,
        updatedAt: now
    })
    saveTasks(tasks)
    console.log('Task added successfully (ID: ' + newId + ')')
}

function update(idArg, desc) {
    const id = parseId(idArg)
    const description = requireDescription(desc)
    const tasks = loadTasks()
    const task = findTask(tasks, id)
    task.description = description
    task.updatedAt = new Date().toISOString()
    saveTasks(tasks)
    console.log('Task updated successfully (ID: ' + id + ')')
}

function remove(idArg) {
    const id = parseId(idArg)
    const tasks = loadTasks()
    findTask(tasks, id)
    saveTasks(tasks.filter(t => t.id !== id))
    console.log('Task deleted successfully (ID: ' + id + ')')
}

function mark(idArg, status) {
    const id = parseId(idArg)
    const tasks = loadTasks()
    const task = findTask(tasks, id)
    if (task.status === status) {
        console.log('Task ' + id + ' is already ' + status)
        return
    }
    task.status = status
    task.updatedAt = new Date().toISOString()
    saveTasks(tasks)
    console.log('Task ' + id + ' marked as ' + status)
}

function list(filter) {
    if (filter !== undefined && !STATUSES.includes(filter)) {
        fail('unknown status "' + filter + '". Use: ' + STATUSES.join(', '))
    }
    const tasks = loadTasks()
    const result = filter ? tasks.filter(t => t.status === filter) : tasks
    if (result.length === 0) {
        console.log(filter ? 'No tasks with status "' + filter + '"' : 'No tasks yet')
        return
    }
    for (const task of result) printTask(task)
}

// ---------- Main ----------
const [cmd, arg1, arg2] = process.argv.slice(2)

switch (cmd) {
    case 'add':
        add(arg1)
        break
    case 'update':
        update(arg1, arg2)
        break
    case 'delete':
        remove(arg1)
        break
    case 'mark-in-progress':
        mark(arg1, 'in-progress')
        break
    case 'mark-done':
        mark(arg1, 'done')
        break
    case 'mark-todo':
        mark(arg1, 'todo')
        break
    case 'list':
        list(arg1)
        break
    default:
        console.error('Error: unknown command "' + cmd + '"')
        showHelp()
        process.exit(1)
}
