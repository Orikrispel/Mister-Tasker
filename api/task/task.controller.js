const taskService = require('./task.service.js')
const logger = require('../../services/logger.service.js')

let isWorkerOn = false

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

async function performTask(req, res) {
  let task = { ...req.body }
  try {
    const updatedTask = await taskService.performTask(task)
    res.json(updatedTask)
  } catch (error) {
    throw err
  }
}

async function runWorker() {
  isWorkerOn = !isWorkerOn
  console.log('toggle work tasker:', isWorkerOn)
  return await taskService.runWorker(isWorkerOn)
}

module.exports = {
  getTasks,
  getTaskById,
  addTask,
  updateTask,
  performTask,
  removeTask,
  runWorker
}
