import java.util.*;


public class Main {


    static boolean bfs(int[][] rGraph, int s, int t, int[] parent, int n) {


        boolean[] visited = new boolean[n];
        Queue<Integer> q = new LinkedList<>();


        q.add(s);
        visited[s] = true;
        parent[s] = -1;


        while (!q.isEmpty()) {


            int u = q.poll();


            for (int v = 0; v < n; v++) {


                if (!visited[v] && rGraph[u][v] > 0) {
                    q.add(v);
                    parent[v] = u;
                    visited[v] = true;
                }
            }
        }


        return visited[t];
    }


    public static void main(String[] args) {


        Scanner sc = new Scanner(System.in);


        System.out.print("Enter number of vertices: ");
        int n = sc.nextInt();


        int[][] graph = new int[n][n];


        System.out.println("Enter capacity matrix:");




        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                graph[i][j] = sc.nextInt();


        System.out.print("Enter source: ");
        int s = sc.nextInt();


        System.out.print("Enter sink: ");
        int t = sc.nextInt();


        int[][] rGraph = new int[n][n];


        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                rGraph[i][j] = graph[i][j];


        int[] parent = new int[n];
        int maxFlow = 0;


        while (bfs(rGraph, s, t, parent, n)) {


            int pathFlow = Integer.MAX_VALUE;


            for (int v = t; v != s; v = parent[v]) {
                int u = parent[v];
                pathFlow = Math.min(pathFlow, rGraph[u][v]);
            }


            for (int v = t; v != s; v = parent[v]) {
                int u = parent[v];
                rGraph[u][v] -= pathFlow;
                rGraph[v][u] += pathFlow;
            }


            maxFlow += pathFlow;
        }


        System.out.println("Maximum Flow = " + maxFlow);
    }
}
