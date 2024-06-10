---
title: LeetCode Guide
publishDate: 2019-10-02 00:00:00
img: /assets/leetcode.png
img_alt: Soft pink and baby blue water ripples together in a subtle texture.
description: |
  A complete guide on the patterns in LeetCode and general interviewing tips!
tags:
  - Data Structures
  - Algorithms
---

## Motivation
This guide assumes basic knowledge of Data Structures! ie. (linked lists, stacks, queues, trees, heaps, sorting, time/space complexity)

Like many, I've had to go through the software engineer recruitment process that unfortunately uses leetcode as a way to test applicants in most cases. Determining applicants is a whole different topic that I won't comment on, however, as I'm here to provide job-seekers in tech (primarily junior ones) with a LeetCode guide!

I'm by no means a die-hard at LeetCode, and in some sense this is here for my future use too, but I've gotten quite good at it having done so many problems, taking algorithms, teaching data structures, and recognizing patterns with the problems. Pattern recognition is what gets one through Algorithms, (shoutout to my CS 170 Berkeley students/alumnus!) so I hope that this guide will prove useful for you.

The sections will be split up as follows: 
1. General interviewing advice 
2. LeetCode Easy
3. LeetCode Medium
4. LeetCode Hard
5. Linked Lists
6. Stacks/Queues
7. Trees
8. Heaps

## General interviewing advice
- Practice different types of problems. Start at easy problems and make your way up to hard ones. Most of the time interviewers ask easy-medium level questions. (I've found if they ask hard it's seems unlikely they are actually hiring) [LeetCode 101 Decal at Berkeley](https://algorithmicthinking.github.io/#/) and [LeetCode Top 150](https://leetcode.com/studyplan/top-interview-150/) are great resources. If you have LeetCode premium you can even look at past interview questions from the company you are interviewing with (assuming it's a large enough company)!
- Use Python! It has the most support and is easiest to program in
- Think aloud! it helps the interviewer know what you are thinking of and some interviewers will give hints towards the right algorithm if you do so.
- It's ok to have a "brute force" algorithm (a perhaps inefficient one), this may often be good enough! especially for CodeSignal (a platform used for testing applicants) problems. But definitely use this as a start and build towards a solution.
- Time/space complexity is usually an added bonus if you know it! Knowing the efficiency of your algorithm is a key factor in engineering, however, so get comfortable analyzing your algorithm.
- Sliding Window, Linked List, Tree, Backtracking problems almost all have nice templates! You'll be doing the same thing for many of the same type of problems and can use templates provided in the sections below.

## LeetCode Easy
LeetCode Easy problems can be solved by most programmers with a basic understanding of Data Structures. Not much more needs to be said here other than just use these problems as a starting point, making sure to remember the techniques used to solve these problems based on the setup of the problem. An interviewer will likely give you an easy problem to start the interview.

## LeetCode Medium
LeetCode Medium Problems are the most common problems you'll get in interviews. If you are attempting these problems, you should be able to immediately see the question and know how to solve it like <30 seconds. 

There are tons of these problems, I would start by focussing my practice by the techniques. Again, [LeetCode 101 Decal at Berkeley](https://algorithmicthinking.github.io/#/) is a super good resource.

## LeetCode Hard
Sometimes you'll encounter problems that are leetcode hard. In these cases, I would have skepticism about hiring, since most people aren't able to complete these problems in a reasonable amount of time. There are definitely some leetcode hards that are reasonable too, though. However, knowing the patterns described below for different problems and applying them still apply! You may need more specialized knowledge, such as bit masking, union finds, dijkstra's, etc.

## Dictionary / Set / HashMap
Often you'll need to store information about the state of something when solving a problem. Any sort of data structure can be used, but often times hashmaps/dictionaries/sets are the most useful because of the O(1) lookup times. 

This is evident in [TwoSum](https://leetcode.com/problems/two-sum/) and many other problems! 

You will pretty much need to use a hashmap everywhere, so there aren't too many tricks:
- Think about how to store information the most efficiently. (usually resulting in hashmap)
- Pairs: this keyword usually means a hashmap is needed to store the pair (elem1: elem2)

Prefix Sum is a variant of these problems. It involves storing for each index of an array, the cumulative sum up to that point. You'll often come across this when you are dealing with array problems dealing with a conditions relative to a sum.

## Linked Lists
You'll rarely need to use linked lists as a structure to solve problems, but questions with linked lists are common.
- What data should you keep track of? Will likely need to do something with a node (insert it somewhere/delete it). How do you change the connections between nodes?
- cycles? -> dfs, or tortoise and hare algorithm
     * tortoise and hare is very advanced but extremely popular among LeetCode enthusiasts, the advantage being cycle detection with O(1) space complexity. Often just noting that you can do this as an improvement is enough and just use DFS (O(n) space complexity) when you want cycle detection. 
- it helps a lot to draw out these problems!

## Stacks / Queues
Use stacks in the following cases:
- You want the LIFO principle. (eg. DFS) or you want to do something with the elements you just recently processed.
- Whenever you see some sort of function-like syntax performing operations with "()", "[]", etc. The term "recursive stack" is a big hint.
- Use a "monotonic stack" whenever you want a sequence to have the condition: next greater, next smaller, previous greater, previous smaller. Essentially you want a sequence of elements that are increasing, decreasing. Read more here for a template/full guide: [Monotonic Stack Guide](https://leetcode.com/discuss/study-guide/2347639/A-comprehensive-guide-and-template-for-monotonic-stack-based-problems)

For queues, almost always it's natural to just use lists to implement the queue properties. Think about what information you need to store in the queue, and does the properties of FIFO actually help?

Use queues in the following cases:
- You want the FIFO principle. (eg. BFS) keyword "first"; you essentially want to store the previous elements and come back to it
- Sliding Window (may need this to keep track of current window elements, but often not needed)

Note: using queues as a data structure in a problem is a little uncommon.

## Sorting and Binary Search
Sorting is a common first step you should think about when given any sort of array-like structure. Then you might ask if binary search can be used to find a particular item?

Binary Search has the precondition that the structure be sorted. You will often use Binary Search to find a **specific number / item.** If you find yourself thinking: if I find a number and it works, but we can potentially find a "better" one (like a max/min) if we look a little further, then binary search is likely your answer!

Occasionally, you might be asked to implement some sort of sorting algorithm from scratch, the easiest is quicksort and should really be the only one you need:
```python
# QuickSort algorithm
def qs(array):
    # use first elem as pivot point 
    # (can use any index as pivot)
    if not array: return []
    pivot = array[0]
    left = [elem for elem in array if elem <= pivot]
    right = [elem for elem in array if elem > pivot]
    return qs(left) + [pivot] + qs(right)
```

## Arrays 
Arrays are the most common question in interviews, as pretty much any problem will involve an array. It's best to go through different techniques to use.

A checklist I usually like to ask myself whenever facing an array is the following:
- Is there any advantage to sorting? or is it already sorted?
   * If there is, can we use binary search?
   * Can we do something with looking at the ends of the array? (Two pointers)
- If I see something about a particular subarray (a contiguous sequence of elements in the array) think: sliding window, monotonic stack
- If you have to check a condition with different subarrays does DP/backtracking help? Likely there are repeated calculations
- Is there some sort of relationship between the elements? Think about nodes and perhaps trees/graph -> DFS, BFS, Tree Traversals

### Two Pointers
If you are looking for a pair of elements or 2 of anything within an array, you'll find it natural to use 2 pointers to keep track of the elements.

This comes up often in interviews and you'll likely be doing something like 
1. Running from both ends of an array
    * One left going towards center; one right going towards center
2. One slow pointer, one fast pointer. 
    * Often comes up with Tortoise and Hare, but is pretty uncommon.
3. One pointer for each array.
    * Perform an operation taking both arrays into account

### Intervals
Sometimes this also comes up in arrays, essentially there are some sort of intervals you have to keep track of and perform operations on.

One way to think about these problems is that if you imagine all of the intervals on an axis and you want to keep track of something. Then thinking about the techniques like sorting and the line sweep algorithm are the first steps that I usually think about.

For example this could be something like [Merge Intervals](https://leetcode.com/problems/merge-intervals/) or [Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/)

Line sweep is relatively simple, it involves looking at an axis of data points and going through every one. If you find yourself putting groups of related points in "boxes" aka "intervals" then line sweep is a good algorithm to use. Here's a very comprehensive guide and list of problems: [Guide](https://leetcode.com/discuss/study-guide/2166045/line-sweep-algorithms)

## Trees
Trees are actually relatively easy, as there are only so many ways to traverse trees:
1. BFS
2. DFS
3. Preorder Traversal
4. Inorder Traversal
5. Postorder Traversal

Think about which of these ways apply to the problem, and find if there's any other information that needs to be kept track of.

One caveat: Tries
The use case for tries are pretty intuitive. Think of Google Search, when you're typing in something, it fills in based on what you've types. A trie is a naive attempt at "guessing" based on some directory of words.

Personally have never had to implement a trie, but supposedly it does come up in interviews? Likely good enough to just note its existence.

## Graphs & Grids
Graph theory is super complex and interesting! For interviews though, we really only need to know BFS/DFS.

Creating a graph: Most common way is to use adjacency lists.

Essentially the relationships look like this:
```
0 : [1,2]
1 : [0]
2 : [0]
```
Where the node 0 has an undirected edge with 1,2 

Grids are one of the most common cases where you'll need to apply bfs/dfs. These sort of matrix problems essentially always will require BFS/DFS, dp, or a brute force approach. Checking end conditions (eg. end of a row/column) is very important for CodeSignal (a common testing platform) problems.

The DFS/BFS algorithm are essentially the same, with the difference of a data structure:
```python
queue/stack init
visited = []
while queue/stack not empty:
  pop elem
  for neighbor in neighbors:
    pre-step
    do something (in dfs case recursive call)
    post-step
```

A very common problem is [rotting oranges](https://leetcode.com/problems/rotting-oranges/).

## Heaps (priority queues)
Heaps are useful in the following cases:
- **kth element** of something, kth smallest, kth largest. This is the most frequent use case! Whenever you see **k** think heap! This can also include a median
- You care about the frequency associated with an item 

Main advantage of heaps (particularly the binary ones) is that they have O(log n) operations. You can often speed up your algorithm with a heap in the kth element case to O(k log n) instead of sorting and then getting the kth element.

Make sure you're familiar with the libraries eg. (heapq for Python). If you need a max heap negate every element!

## Sliding Window
As the name suggests sliding window problems are characterized by looking at a subarray or "window" of elements and then shifting the size of the window depending on some conditions. 

Naturally, you should find yourself looking at windows just based on the context of the problem, so these problems aren't too hard to recognize.

A great template can be found here: [template](https://leetcode.com/problems/minimum-window-substring/solutions/26808/here-is-a-10-line-template-that-can-solve-most-substring-problems/)

## Greedy Algorithms
Sometimes a greedy algorithm is the best one, something that gets close to the "true" answer, but is not completely optimal can be very useful such is the case in machine learning.

Greedy algorithms should come fairly naturally and is often one of the first approaches to a problem. You'll try to get the items/numbers that are "as close" to the answer as possible. You might also want to keep track of some items, in which case greedy turns into DP. Within interviews, using the greedy approach is slightly uncommon, and if you have a greedy algorithm that gets close, it usually isn't the approach the interviewer is looking for.

## Dynamic Programs (DP) / Backtrack
If you find yourself completing a problem usually recursively and realize that a calculation that was done previously can be used again. Think DP!
1. What do I need to keep track of?
2. What's the recursive formula?
3. What's the base case?

Backtracking is also very related to DP. I like to think of it as "going through all possible combinations." If you find yourself going through combinations in a tree like manner and then needing to go "back up the tree" think backtracking. Luckily there is also a very good resource that describes essentially all backtracking problems: [General Approach to Backtracking](https://leetcode.com/problems/subsets/solutions/27281/a-general-approach-to-backtracking-questions-in-java-subsets-permutations-combination-sum-palindrome-partitioning/)

For reference here is the template (pseudocode), solving the problem "Subsets" but can be used for most other backtracking problems:
```java
List<List<Integer>> subsets(int[] nums) {
    Create list of lists with ints
    Sort nums
    backtrack(list, new ArrayList<>(), nums, 0);
    return list;
}

backtrack(List<List<Integer>> list , List<Integer> tempList, int [] nums, int start){
    list.add(tempList);
    for(int i = start; i < nums.length; i++){
        tempList.add(nums[i]); // add element to temp list for future lists w/ this elem
        backtrack(list, tempList, nums, i + 1); // populate all sets with this elem
        tempList.remove(tempList.size() - 1); // remove element added
    }
}
```

## System Design
I'm a junior engineer, so at least within interviews, I don't really have to be too concerned with system design questions, these are usually reserved for more experienced software engineers with a few years of experience!

Here's a pretty good post of case studies on LinkedIn: [read here](https://www.linkedin.com/feed/update/urn:li:activity:7158679108464369665?updateEntityUrn=urn%3Ali%3Afs_updateV2%3A%28urn%3Ali%3Aactivity%3A7158679108464369665%2CFEED_DETAIL%2CEMPTY%2CDEFAULT%2Cfalse%29)