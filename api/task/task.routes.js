const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { getTasks, getTaskById, addTask, updateTask, performTask, removeTask, runWorker } = require('./task.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', log, getTasks)
router.get('/worker', runWorker)
router.get('/:id', getTaskById)
router.post('/', addTask)
router.put('/:id', updateTask)
router.put('/:id/start', performTask)
router.delete('/:id', removeTask)
// router.delete('/:id', requireAuth, requireAdmin, removeTask)


module.exports = router