export type Todo = { id: string; text: string; completed_at: string | null; created_at: string };

/** Open todos first in the order they were added; checked ones sink to the bottom in the order they were checked. */
export function sortTodos(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => {
    if (!!a.completed_at !== !!b.completed_at) return a.completed_at ? 1 : -1;
    if (a.completed_at && b.completed_at) return a.completed_at.localeCompare(b.completed_at);
    return a.created_at.localeCompare(b.created_at);
  });
}
