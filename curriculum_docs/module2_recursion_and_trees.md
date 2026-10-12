# Module 2: Recursion, Divide-and-Conquer, and Binary Trees

## 1. Foundational Concept of Recursion
Recursion is an algorithmic paradigm where a function solves a problem by calling smaller instances of itself. Every recursive solution requires two components:
1. **Base Case**: The terminal condition that stops recursion without making further recursive calls, preventing infinite loops.
2. **Recursive Step (Inductive Step)**: Decomposes the primary input toward the base case and aggregates the resulting sub-solutions.

## 2. Call Stack & Stack Overflow
Each recursive invocation pushes an activation record (stack frame) onto the program call stack, saving local parameters, variables, and the return instruction address.
- If a recursive implementation fails to hit its base case, stack frames consume all allocated thread stack space, triggering a **Stack Overflow Error**.
- **Tail Recursion**: A recursive function where the recursive call is the final statement executed in the function, allowing compiler optimization to reuse the existing stack frame ($O(1)$ auxiliary stack space).

## 3. Hierarchical Structures: Binary Trees
A Binary Tree is a non-linear data structure where each node has at most two children, labeled left and right.
- **Binary Search Tree (BST) Property**: For any node $N$, every key in $N$'s left subtree is strictly less than $N$'s key, and every key in $N$'s right subtree is strictly greater.
- **Traversal Paradigms**:
  - *In-Order (Left, Root, Right)*: Produces sorted order for a BST.
  - *Pre-Order (Root, Left, Right)*: Used for serialization and deep tree copies.
  - *Post-Order (Left, Right, Root)*: Used for deleting nodes from leaves up to the root.

## 4. Time Complexity Bottlenecks
- Balanced BST Search/Insertion: $O(\log n)$ average time complexity.
- Degenerate BST (skewed like a linked list): Degrades to $O(n)$ linear complexity.

## 5. Diagnostic Review Check
1. How does the call stack manage state between pre-recursive and post-recursive function statements?
2. Given a degenerate binary tree, what self-balancing algorithms (e.g., AVL, Red-Black) restore logarithmic search guarantees?