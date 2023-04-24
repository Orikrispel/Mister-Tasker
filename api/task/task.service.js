const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const externalService = require('../../services/external.service')
const socketService = require('../../services/socket.service')


const ObjectId = require('mongodb').ObjectId

async function query(filterBy = { title: '', status: [], importance: [], }) {
    try {
        const criteria = buildCriteria(filterBy)
        const collection = await dbService.getCollection('task')
        const tasks = await collection.find(criteria).toArray()
        return tasks
    } catch (err) {
        logger.error('cannot find tasks', err)
        throw err
    }
}

function buildCriteria(filterBy) {
    let criteria = {}

    if (filterBy.title) criteria.$text = { $search: filterBy.title }
    if (filterBy.importance.length) {
        const importance = filterBy.importance.map(num => num = +num)
        criteria.importance = { $in: importance }
    }
    if (filterBy.status.length) criteria.status = { $in: filterBy.status }

    return criteria
}

async function getById(taskId) {
    try {
        const collection = await dbService.getCollection('task')
        const task = collection.findOne({ _id: ObjectId(taskId) })
        return task
    } catch (err) {
        logger.error(`while finding task ${taskId}`, err)
        throw err
    }
}

async function remove(taskId) {
    try {
        const collection = await dbService.getCollection('task')
        await collection.deleteOne({ _id: ObjectId(taskId) })
        return taskId
    } catch (err) {
        logger.error(`cannot remove task ${taskId}`, err)
        throw err
    }
}

async function add(task) {
    try {
        const collection = await dbService.getCollection('task')
        await collection.insertOne(task)
        return task
    } catch (err) {
        logger.error('cannot insert task', err)
        throw err
    }
}

async function update(task) {
    try {
        const taskToSave = {
            title: task.title,
            status: task.status,
            description: task.description,
            importance: task.importance,
            lastTriedAt: task.lastTriedAt,
            triesCount: task.triesCount,
            doneAt: task.doneAt,
            errors: task.errors
        }
        socketService.emitTo('update-task', taskToSave)
        const collection = await dbService.getCollection('task')
        await collection.updateOne({ _id: ObjectId(task._id) }, { $set: taskToSave })
        return task
    } catch (err) {
        logger.error(`cannot update task ${task._id}`, err)
        throw err
    }
}

async function performTask(task) {
    try {
        // TODO: update task status to running and save to DB
        task.status = 'Running'
        task = await update(task)
        // TODO: execute the task using: externalService.execute
        await externalService.execute(task)
        // TODO: update task for success (doneAt, status)
        task.doneAt = Date.now()
        task.status = 'Done'
    } catch (error) {
        // TODO: update task for error: status, errors
        logger.debug(`error in executing task ${task._id}:`, error)
        task.status = 'Failed'
        task.errors.unshift(error)
        throw err
    } finally {
        // TODO: update task lastTried, triesCount and save to DB
        task.lastTried = Date.now()
        task.triesCount++
        await update(task)
        console.log('task have been updated')
        return task
    }
}

async function runWorker(isWorkerOn) {
    if (!isWorkerOn) return
    // The isWorkerOn is toggled by the button: "Start/Stop Task Worker"
    console.log('start working...')
    var delay = 5000
    try {
        const task = await getNextTask()
        if (task) {
            try {
                await performTask(task)
            } catch (err) {
                console.log(`Failed Task`, err)
            } finally {
                delay = 1
            }
        } else {
            console.log('Snoozing... no tasks to perform')
            return true
        }
    } catch (err) {
        console.log(`Failed getting next task to execute`, err)
    } finally {
        setTimeout(runWorker, delay)
    }
}

async function getNextTask() {
    try {
        let tasks = await query()
        tasks = tasks.filter(t => t.triesCount < 5 && !(t.status === 'Done'))
        tasks = tasks.sort((a, b) => a.importance - b.importance)
        // console.log('tasks:', tasks)
        // console.log('task poped out:', tasks.pop())
        // return null
        return tasks.pop()
    } catch (error) {
        throw error
    }
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    performTask,
    runWorker,
    getNextTask

}
