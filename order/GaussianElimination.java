import java.util.*;

public class GaussianElimination {

    // Matrix size (N x N)
    private static final int N = 3;

    public static void main(String[] args) {
        // Augmented matrix [A|B]
        double[][] mat = {
            { 3.0, 2.0, -4.0, 3.0 },
            { 2.0, 3.0, 3.0, 15.0 },
            { 5.0, -3.0, 1.0, 14.0 }
        };

        gaussianElimination(mat);
    }

    public static void gaussianElimination(double[][] mat) {
        /* Reduction into upper triangular form */
        int singularFlag = forwardElim(mat);

        /* If matrix is singular */
        if (singularFlag != -1) {
            System.out.println("Singular Matrix.");

            /* If the RHS of the singular row is non-zero, it's inconsistent */
            if (mat[singularFlag][N] != 0)
                System.out.println("Inconsistent System.");
            else
                System.out.println("May have infinitely many solutions.");

            return;
        }

        /* Back substitution to find solutions */
        backSub(mat);
    }

    // Function to swap two rows
    private static void swapRow(double[][] mat, int i, int j) {
        for (int k = 0; k <= N; k++) {
            double temp = mat[i][k];
            mat[i][k] = mat[j][k];
            mat[j][k] = temp;
        }
    }

    // Phase 1: Forward Elimination
    private static int forwardElim(double[][] mat) {
        for (int k = 0; k < N; k++) {
            // Initialize maximum index and value for pivoting
            int iMax = k;
            double vMax = mat[iMax][k];

            /* Find greater pivot for better numerical stability */
            for (int i = k + 1; i < N; i++) {
                if (Math.abs(mat[i][k]) > Math.abs(vMax)) {
                    vMax = mat[i][k];
                    iMax = i;
                }
            }

            /* If a principal diagonal element is zero, matrix is singular */
            if (mat[iMax][k] == 0) {
                return k; // Matrix is singular
            }

            /* Swap the current row with the row having the largest pivot */
            if (iMax != k) {
                swapRow(mat, k, iMax);
            }

            for (int i = k + 1; i < N; i++) {
                /* Factor f to set current column elements to zero */
                double f = mat[i][k] / mat[k][k];

                /* Subtract f * k-th row from the i-th row */
                for (int j = k + 1; j <= N; j++) {
                    mat[i][j] -= mat[k][j] * f;
                }

                /* Fill lower triangular matrix with zeros */
                mat[i][k] = 0;
            }
        }
        return -1;
    }

    // Phase 2: Back Substitution
    private static void backSub(double[][] mat) {
        double[] x = new double[N]; // Array to store solution

        /* Start calculating from the last equation up to the first */
        for (int i = N - 1; i >= 0; i--) {
            x[i] = mat[i][N];

            /* Subtract values of already solved variables */
            for (int j = i + 1; j < N; j++) {
                x[i] -= mat[i][j] * x[j];
            }

            /* Divide by the coefficient of the variable being solved */
            x[i] = x[i] / mat[i][i];
        }

        System.out.println("\nSolution for the system:");
        for (int i = 0; i < N; i++) {
            System.out.printf("%.6f\n", x[i]);
        }
    }
}