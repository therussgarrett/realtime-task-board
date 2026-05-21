import { Router } from 'express';
import { getBoards, getBoard, createBoard, deleteBoard, updateBoard } from '../controllers/boardController';
const router = Router();

router.get('/', getBoards);
router.get('/:boardId', getBoard);
router.post('/', createBoard);
router.delete('/:boardId', deleteBoard);
router.patch('/:boardId', updateBoard);



module.exports = router;
export default router;
