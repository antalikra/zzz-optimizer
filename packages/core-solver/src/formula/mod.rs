//! DAG damage-formula engine.
//!
//! A formula is an arena of [`Node`]s (Struct-of-Arrays-friendly). It is built
//! once and evaluated against a [`Stats`] context. All operators are monotonic
//! and analyzable, so the Phase-3 solver can derive per-stat monotonicity for
//! its branch-and-bound bound. See docs/SOLVER.md and docs/DATA-MODEL.md.

use crate::domain::{Stat, Stats};

pub mod library;

pub type NodeId = usize;

/// A node in the formula DAG. Children are referenced by arena index.
#[derive(Debug, Clone)]
pub enum Node {
    Const(f64),
    Stat(Stat),
    Add(NodeId, NodeId),
    Sub(NodeId, NodeId),
    Mul(NodeId, NodeId),
    Div(NodeId, NodeId),
    Min(NodeId, NodeId),
    Max(NodeId, NodeId),
}

/// Arena of formula nodes. Callers track the root id returned by builders.
#[derive(Debug, Clone, Default)]
pub struct Dag {
    nodes: Vec<Node>,
}

impl Dag {
    pub fn new() -> Self {
        Self::default()
    }

    fn push(&mut self, n: Node) -> NodeId {
        self.nodes.push(n);
        self.nodes.len() - 1
    }

    pub fn constant(&mut self, v: f64) -> NodeId {
        self.push(Node::Const(v))
    }
    pub fn stat(&mut self, s: Stat) -> NodeId {
        self.push(Node::Stat(s))
    }
    pub fn add(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Add(a, b))
    }
    pub fn sub(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Sub(a, b))
    }
    pub fn mul(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Mul(a, b))
    }
    pub fn div(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Div(a, b))
    }
    pub fn min(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Min(a, b))
    }
    pub fn max(&mut self, a: NodeId, b: NodeId) -> NodeId {
        self.push(Node::Max(a, b))
    }

    /// Evaluate the subtree rooted at `root` against `stats`.
    /// Phase 2: simple recursion (re-evaluates shared subnodes). Phase 3 adds
    /// memoization for the hot loop.
    pub fn eval(&self, root: NodeId, stats: &Stats) -> f64 {
        match &self.nodes[root] {
            Node::Const(v) => *v,
            Node::Stat(s) => stats.get(*s),
            Node::Add(a, b) => self.eval(*a, stats) + self.eval(*b, stats),
            Node::Sub(a, b) => self.eval(*a, stats) - self.eval(*b, stats),
            Node::Mul(a, b) => self.eval(*a, stats) * self.eval(*b, stats),
            Node::Div(a, b) => self.eval(*a, stats) / self.eval(*b, stats),
            Node::Min(a, b) => self.eval(*a, stats).min(self.eval(*b, stats)),
            Node::Max(a, b) => self.eval(*a, stats).max(self.eval(*b, stats)),
        }
    }

    /// Number of nodes (for diagnostics/tests).
    pub fn len(&self) -> usize {
        self.nodes.len()
    }

    pub fn is_empty(&self) -> bool {
        self.nodes.is_empty()
    }
}
