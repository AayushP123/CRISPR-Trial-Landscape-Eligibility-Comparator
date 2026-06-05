# Number of Islands
class solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        if not grid:
            return 0
        
        rows = len(grid)
        cols = len(grid[0])
        visited = set()
        islands = 0

        def bfs(r, c):
            q = collections.deque()
            visited.add(r, c)
            q.append((r, c))
            while q:
                row, col = q.popleft()
                directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]

                for dr, dc in directions:
                    r, c = (r + dr), (c + dc)
                    if ((r) in range(rows) and
                        (c) in range(cols) and
                        ((r), (c)) not in visited and
                        grid[r][c] == "1"):
                        q.append((r), (c))
                        visited.add((r), (c))

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1" and (r, c) not in visited:
                    bfs(r, c)
                    islands += 1
        return islands


# Max area of Island
class solution2:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        rows = len(grid)
        cols = len(grid[0])
        maxArea = 0
        tempArea = 0

        visited = set()

        def bfs(r, c):
            q = collections.deque()
            q.append((r, c))
            visited.add((r, c))

            while q:
                row, col = q.popleft()
                directions = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                for dr, dc in directions:
                    r, c = (r + dr), (c + dc)
                    if( r in range(rows) and
                       c in range(cols) and
                       grid[r][c] == "1" and
                       (r, c) not in visited):
                        tempArea += 1
                        visited.add((r, c))
                        q.append((r, c))
                        maxArea = max(tempArea, maxArea)

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1" and (r, c) not in visited:
                    bfs(r, c)

        return maxArea
