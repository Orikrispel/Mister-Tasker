const taskService = require('./task.service.js')
const externalService = require('../../services/external.service.js')

const logger = require('../../services/logger.service.js')

async function getTasks(req, res) {
  try {
    logger.debug('Getting Tasks')
    const filterBy = {
      title: req.query.title || '',
      status: req.query.status || [],
      importance: req.query.importance || [],
    }
    const tasks = await taskService.query(filterBy)
    res.json(tasks)
  } catch (err) {
    logger.error('Failed to get tasks', err)
    res.status(500).send({ err: 'Failed to get tasks' })
  }
}

async function getTaskById(req, res) {
  try {
    const taskId = req.params.id
    const task = await taskService.getById(taskId)
    res.json(task)
  } catch (err) {
    logger.error('Failed to get task', err)
    res.status(500).send({ err: 'Failed to get task' })
  }
}

async function addTask(req, res) {
  try {
    const task = req.body
    console.log('task:', task)
    const addedTask = await taskService.add(task)
    res.json(addedTask)
  } catch (err) {
    logger.error('Failed to add task', err)
    res.status(500).send({ err: 'Failed to add task' })
  }
}


async function updateTask(req, res) {
  try {
    const task = req.body
    const updatedTask = await taskService.update(task)
    res.json(updatedTask)
  } catch (err) {
    logger.error('Failed to update task', err)
    res.status(500).send({ err: 'Failed to update task' })

  }
}

async function performTask(req, res) {
  console.log('whyyyy')
  let task = { ...req.body }
  try {
    // TODO: update task status to running and save to DB
    task.status = 'running'
    const updatedTask = await taskService.update(task)
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
  } finally {
    // TODO: update task lastTried, triesCount and save to DB
    task.lastTried = Date.now()
    task.triesCount++
    const finalTask = await taskService.update(task)
    console.log('finalTask:', finalTask)
    res.json(task)
  }
}

async function removeTask(req, res) {
  try {
    const taskId = req.params.id
    const removedId = await taskService.remove(taskId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove task', err)
    res.status(500).send({ err: 'Failed to remove task' })
  }
}

async function addTaskMsg(req, res) {
  const { loggedinUser } = req
  try {
    const taskId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser
    }
    const savedMsg = await taskService.addTaskMsg(taskId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update task', err)
    res.status(500).send({ err: 'Failed to update task' })

  }
}

async function removeTaskMsg(req, res) {
  const { loggedinUser } = req
  try {
    const taskId = req.params.id
    const { msgId } = req.params

    const removedId = await taskService.removeTaskMsg(taskId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove task msg', err)
    res.status(500).send({ err: 'Failed to remove task msg' })

  }
}

module.exports = {
  getTasks,
  getTaskById,
  addTask,
  updateTask,
  performTask,
  removeTask,
  addTaskMsg,
  removeTaskMsg
}
