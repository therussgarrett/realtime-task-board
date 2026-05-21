import { Router } from 'express';
import {
  getTasksByBoard,
  createTask,
  updateTask,
  deleteTask
} from '../controllers/taskController';
import { requireAuth } from '../middleware/requireAuth';


const router = Router();

router.use(requireAuth);

router.get('/board/:boardId', getTasksByBoard);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);
router.delete('/:taskId', deleteTask);


export default router;
module.exports = router;