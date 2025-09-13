import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const TaskGroupList = lazy(() => import('./TaskGroupList'));
const TaskGroupDetails = lazy(() => import('./TaskGroupDetails'));

const GroupView = () => {
  return (
    <Routes>
      <Route path="/" element={<TaskGroupList />} />
      <Route path="/:groupId" element={<TaskGroupDetails />} />
    </Routes>
  );
};

export default GroupView;
