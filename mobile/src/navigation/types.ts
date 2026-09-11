import { Task } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  AddEditTask: { task?: Task };
  TaskDetail: { task: Task };
};
