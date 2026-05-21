import { Router } from 'express';
import { getBoards, getBoard, createBoard, deleteBoard, updateBoard } from '../controllers/boardController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:boardId', getBoard);
router.delete('/:boardId', deleteBoard);
router.patch('/:boardId', updateBoard);



module.exports = router;
export default router;
