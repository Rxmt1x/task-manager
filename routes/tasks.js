const express = require('express');
const { Brackets } = require('typeorm'); // az typeORM vase title va description
const AppDataSource = require('../src/data-source');
const authGuard = require('../middleware/auth');
const router = express.Router();
const ALLOWED_STATUS = ['pending', 'in progress', 'done'];
const ALLOWED_PRIORITY = ['low', 'medium', 'high']; //gozine ha baraye stat haye task az vorodoe bad data jelo giri mikone
router.use(authGuard);

function pageLimit(query) { // tedad taskhaye har page ro handle mikone
  const page = Number(query.page) > 0 ? Number(query.page) : 1; 
  const requestedLimit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  const limit = Math.min(requestedLimit, 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function normalDate(value) {
  if (value === undefined) return undefined; // age datei az client daryaft nashe baraye date chizi nanevis 
  if (value === null || value === '') return null; //age client date ro khali bezare kadr ro khali bezar

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'INVALID_DATE';
  } // age be jaye date dorost chize invalid vared beshe INVALID_DATE bede 
  return parsed;
}

router.get('/',async (req, res)=> { // GET /task
  const { page, limit, offset } = pageLimit(req.query); // function pagelimit ro extract mikone
  const title = typeof req.query.title === 'string' ? req.query.title.trim() : ''; // age user esmi vase task nazare be jaye crash kardan jasho khali mizare 
  const status = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : ''; // " baraye status
  const priority = typeof req.query.priority === 'string' ? req.query.priority.trim().toLowerCase() : ''; // " baraye priority

  if (status && !ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
  } // age client stat eshtebah vared kone error mide va stat haye dorost ro be client mige

  if (priority && !ALLOWED_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Allowed: ${ALLOWED_PRIORITY.join(', ')}` });
  } // " baraye priority

  try {
    const taskRepo = AppDataSource.getRepository('Task'); 
    const queryBuilder = taskRepo
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId: req.user.id }); // az user ID estefade mikone ta faghat taks haye useer haro be khodeshon neshon bede

  if (title) { // functione search 
    queryBuilder.andWhere(
      new Brackets((query) =>{
        query.where('task.title ILIKE :search', { search: `%${title}%` }).orWhere('task.description ILIKE :search', {
          search: `%${title}%`, // az title tasko peyda mikoone
         });
        })
      );
    }

  if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
  }

  if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
  } // 2 ta filtere bae asase sta va priority

  queryBuilder.orderBy('task.createdAt', 'DESC').skip(offset).take(limit); // tartib namayeshe task ha az jadid tarin shoro beshe
  const [tasks, total] = await queryBuilder.getManyAndCount();

  return res.status(200).json({ // json migire
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
  });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

router.get('/:id', async (req, res) => { // ye task ro peyda mikone
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const task = await taskRepo.findOneBy({ id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching task' });
  }
});

router.post('/', async (req, res) => { // task misaze
  const { title, description, status = 'pending', priority = 'medium', dueDate = null } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (!ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
  }

  if (!ALLOWED_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Allowed: ${ALLOWED_PRIORITY.join(', ')}` });
  }

  const normalizedDueDate = normalDate(dueDate);
  if (normalizedDueDate === 'INVALID_DATE') {
    return res.status(400).json({ error: 'Invalid dueDate format' });
  }

  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const task = taskRepo.create({
      title: title.trim(),
      description: description || null,
      status,
      priority,
      dueDate: normalizedDueDate,
      userId: req.user.id,
    });

    const savedTask = await taskRepo.save(task);
    return res.status(201).json({ message: 'Task created', task: savedTask });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error creating task' });
  }
});

router.patch('/:id', async (req, res) => { // task ro edit mikone
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const { title, description, status, priority, dueDate } = req.body;

  if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUS.join(', ')}` });
  }

  if (priority !== undefined && !ALLOWED_PRIORITY.includes(priority)) {
    return res.status(400).json({ error: `Invalid priority. Allowed: ${ALLOWED_PRIORITY.join(', ')}` });
  }

  const normalizedDueDate = normalDate(dueDate);
  if (normalizedDueDate === 'INVALID_DATE') {
    return res.status(400).json({ error: 'Invalid dueDate format' });
  }

  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const task = await taskRepo.findOneBy({ id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = description || null;
    }

    if (status !== undefined) {
      task.status = status;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (dueDate !== undefined) {
      task.dueDate = normalizedDueDate;
    }

    const updatedTask = await taskRepo.save(task);
    return res.status(200).json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error updating task' });
  }
});

router.delete('/:id', async (req, res) => { // task ro delete mikone
  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId)) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const task = await taskRepo.findOneBy({ id: taskId, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await taskRepo.remove(task);
    return res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error deleting task' });
  }
});

module.exports = router;