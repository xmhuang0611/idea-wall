# Idea Wall生命周期流程文档

## 概述

Idea Wall平台提供了一个结构化的创意管理流程，从创意提交到最终实施。本文档详细说明了创意的生命周期，包括各阶段的流程、参与角色及系统交互。系统采用独立实体模型，将Idea、Idea Session和Idea Incubator作为相互关联但独立版本控制的实体。

## 实体关系模型

系统基于三个核心实体，它们之间是一对一的关系：

1. **Idea**: 基础实体，包含创意的基本信息、标签、投票等。一个Idea关联一个Session。
2. **Idea Session**: 评审阶段实体，包含评审申请的详细信息和评审结果。每个Session有独立的版本控制，可以多次迭代改进。
3. **Idea Incubator**: 孵化阶段实体，包含孵化申请的Lean Canvas和孵化结果。每个Incubator有独立的版本控制，可以多次迭代改进。

这种设计允许评审和孵化过程独立迭代，同时保持一一对应的关系。一个Idea只能创建一个Session，一个Session通过评审后只能创建一个Incubator。

## 创意生命周期总览

创意在Idea Wall平台经历以下主要阶段：

1. **创建阶段**: 用户创建基础Idea实体
2. **评审阶段**: 为Idea创建Session并提交评审
3. **孵化阶段**: 评审通过后，为Idea创建Incubator并提交孵化
4. **实施阶段**: 孵化通过后，进入实施

任何阶段如果被拒绝或需要改进，用户可以更新相应实体并创建新版本进行重新提交。

## 角色定义

- **普通用户**: 可提交创意，参与讨论
- **IDEA_SESSION_PANEL_REVIEWER**: 评审小组成员，负责初审
- **IDEA_INCUBATOR_REVIEWER**: 孵化小组成员，负责深度评估
- **ADMIN**: 系统管理员，管理整个平台

## 详细流程

### 1. 创建阶段
#### 数据流

- 用户在Ideas Collection中创建新记录

#### 前端流程
1. 用户访问"提交创意"页面
2. 填写基本信息 (标题、描述、标签等)
3. 提交后，创意进入个人中心的"我的创意"列表

#### 后端处理
1. 验证提交数据
2. 创建Ideas记录
3. 初始化相关计数器 (votes, comments, bookmarks)
4. 记录操作日志到Logs Collection

### 2. 评审阶段 (Idea Session)

#### 数据流
- 为Idea创建一个Idea Session记录
- 更新Ideas的current_status为"IN_SESSION_REVIEW"
- 设置Ideas的current_session_id为新创建的Session ID
- 创建相关通知

#### 前端流程 (创意提交者)
1. 用户选择自己创建的创意提交评审
2. 填写评审申请表单，包括:
   - problem_statements: 问题陈述
   - solutions: 解决方案
   - value: 价值主张
3. 提交后，系统创建新的Idea Session记录(session_version=1)，与Idea建立一对一关系
4. 如果Session被标记为"NEED_IMPROVEMENT"或"REJECTED"且允许重新提交:
   - 可以查看详细的反馈意见
   - 更新现有Session并创建新版本(session_version+1)
   - 完善Session内容并重新提交评审

#### 前端流程 (评审成员)
1. 评审成员在评审任务中心查看待审核Session
2. 选择Session进入评审详情页
3. 查看Session信息和评审申请
4. **提交评审结果（第一步）**:
   - 填写评分和评论 (创新性、价值、可行性、影响力和投资回报率)
   - 提交个人评审结果，系统记录该评审人的意见
   - 页面显示当前评审数量和最低要求数量
5. **做出最终决定（第二步）**:
   - 当评审数量达到最低要求后，页面显示"做出最终决定"选项
   - 任何评审成员可以点击此选项，进入最终决定页面
   - 查看所有评审成员的评分和意见
   - 选择最终决定（APPROVED/REJECTED/NEED_IMPROVEMENT）
   - 填写总结性评论
   - 提交最终决定

#### 后端处理
1. 创建或更新Idea Session记录:
   - 新建时设置session_version=1，is_current=true，has_final_decision=false
   - 更新时创建新版本(session_version+1)，将旧版本is_current设为false，新版本is_current设为true
2. 更新Session状态为"IN_REVIEW"
3. 更新Idea的current_status为"IN_SESSION_REVIEW"，current_session_id为当前Session ID
4. **处理单独评审结果（第一步）**:
   - 接收并保存评审人员提交的评审结果到Idea Review Collection
   - 更新Session的review_count计数
   - 检查是否达到min_required_reviews数量
5. **处理最终决定（第二步）**:
   - 验证评审数量是否达到最低要求
   - 保存最终决定到Final Decision Collection
   - 更新Session的has_final_decision=true，final_reviewer_id、final_decision和final_comments字段
   - 更新Session状态为相应决定 (APPROVED/REJECTED/NEED_IMPROVEMENT)
   - 更新Idea的current_status（如SESSION_APPROVED、SESSION_REJECTED等）
   - 发送通知给创意提交者
6. 记录操作日志

### 3. 孵化阶段 (Idea Incubator)

#### 数据流
- 为Idea创建一个Idea Incubator记录
- 更新Ideas的current_status为"IN_INCUBATION_REVIEW"
- 设置Ideas的current_incubator_id为新创建的Incubator ID
- 创建相关通知

#### 前端流程 (创意提交者)
1. Session通过评审后，提交者收到通知
2. 在创意详情页选择"提交孵化申请"
3. 填写Lean Canvas表单，包括:
   - problem: 问题
   - solution: 解决方案
   - unique_value: 独特价值
   - customer_segments: 客户细分
   - 其他Lean Canvas相关字段
4. 提交后，系统创建新的Idea Incubator记录(incubator_version=1)，与Idea建立一对一关系
5. 如果Incubator被标记为"NEED_IMPROVEMENT"或"REJECTED"且允许重新提交:
   - 可以查看详细的反馈意见
   - 更新现有Incubator并创建新版本(incubator_version+1)
   - 完善Incubator内容并重新提交孵化

#### 前端流程 (孵化成员)
1. 孵化成员在孵化任务中心查看待评估Incubator
2. 选择Incubator进入孵化评估页面
3. 查看Incubator的Lean Canvas和关联Idea信息
4. **提交评估结果（第一步）**:
   - 填写评分和评论 (创新性、价值、可行性、影响力和投资回报率)
   - 提交个人评估结果，系统记录该孵化成员的意见
   - 页面显示当前评估数量和最低要求数量
5. **做出最终决定（第二步）**:
   - 当评估数量达到最低要求后，页面显示"做出最终决定"选项
   - 任何孵化成员可以点击此选项，进入最终决定页面
   - 查看所有孵化成员的评分和意见
   - 选择最终决定（APPROVED/REJECTED/NEED_IMPROVEMENT）
   - 填写总结性评论
   - 提交最终决定

#### 后端处理
1. 创建或更新Idea Incubator记录:
   - 新建时设置incubator_version=1，is_current=true，has_final_decision=false
   - 更新时创建新版本(incubator_version+1)，将旧版本is_current设为false，新版本is_current设为true
2. 更新Incubator状态为"IN_REVIEW"
3. 更新Idea的current_status为"IN_INCUBATION_REVIEW"，current_incubator_id为当前Incubator ID
4. **处理单独评估结果（第一步）**:
   - 接收并保存孵化成员提交的评估结果到Idea Review Collection
   - 更新Incubator的review_count计数
   - 检查是否达到min_required_reviews数量
5. **处理最终决定（第二步）**:
   - 验证评估数量是否达到最低要求
   - 保存最终决定到Final Decision Collection
   - 更新Incubator的has_final_decision=true，final_reviewer_id、final_decision和final_comments字段
   - 更新Incubator状态为相应决定 (APPROVED/REJECTED/NEED_IMPROVEMENT)
   - 更新Idea的current_status（如INCUBATION_APPROVED、INCUBATION_REJECTED等）
   - 发送通知给创意提交者
6. 记录操作日志

### 4. 实施阶段

#### 数据流
- 更新Ideas的current_status为"IMPLEMENTATION"
- 可能创建新的实施跟踪记录 (根据具体实现)

#### 前端流程
1. 创意通过孵化后，进入实施阶段
2. 系统可提供项目管理工具进行跟踪
3. 提交者和相关人员可更新实施进度

#### 后端处理
1. 更新Ideas的current_status为"IMPLEMENTATION"
2. 定期更新实施进度
3. 记录操作日志

## 版本管理

系统采用独立版本控制机制，保持一对一的实体关系:

1. **Idea Session版本管理**:
   - 每个Idea只有一个Session，但Session可以有多个版本
   - 首次提交评审时创建session_version=1，is_current=true
   - 每次重新提交评审时更新现有Session，创建新版本(session_version+1)
   - 新版本设置is_current=true，旧版本设置is_current=false
   - 通过previous_session_id字段维护Session版本链
   - 每个版本保存完整的评审申请内容和状态

2. **Idea Incubator版本管理**:
   - 每个Idea只有一个Incubator，但Incubator可以有多个版本
   - 首次提交孵化时创建incubator_version=1，is_current=true
   - 每次重新提交孵化时更新现有Incubator，创建新版本(incubator_version+1)
   - 新版本设置is_current=true，旧版本设置is_current=false
   - 通过previous_incubator_id字段维护Incubator版本链
   - 每个版本保存完整的Lean Canvas和状态

3. **版本历史查看**:
   - 用户可以查看特定Idea关联的Session和Incubator的所有历史版本
   - 可以查看每个版本的状态变更和反馈意见
   - 可以比较不同版本之间的差异

## 状态流转图

```
Idea创建 (PUBLISHED)
      ↓
创建Session → IN_REVIEW → [评审提交个人结果] → 达到最低评审数量
      ↓                                       ↓
更新Idea状态                           任意评审人做出最终决定
(IN_SESSION_REVIEW)                            ↓
                                  APPROVED / REJECTED / NEED_IMPROVEMENT
                                      ↓           ↓
                                      ↓    [如允许重新提交] → 更新Session创建新版本 → IN_REVIEW
                                      ↓
                        [如APPROVED] → 更新Idea状态(SESSION_APPROVED)
                                      ↓
                                  创建Incubator → IN_REVIEW → [评估提交个人结果] → 达到最低评估数量
                                      ↓                                          ↓
                                更新Idea状态                             任意孵化成员做出最终决定
                            (IN_INCUBATION_REVIEW)                               ↓
                                                            APPROVED / REJECTED / NEED_IMPROVEMENT
                                                                ↓           ↓
                                                                ↓    [如允许重新提交] → 更新Incubator创建新版本 → IN_REVIEW
                                                                ↓
                                                   [如APPROVED] → 更新Idea状态(INCUBATION_APPROVED)
                                                                ↓
                                                             实施阶段
                                                        (IMPLEMENTATION)



创建Idea
  |
  v
[PUBLISHED]----(提交到评审)----+
                                    |
                                    v
                               创建Session
                                    |
                                    v
                             IN_SESSION_REVIEW <----+
                                    |              |
                                    v              |
                       [评审提交个人结果(至少2名)]     |
                                    |              |
                                    v              |
                           达到最低评审数量           |
                                    |              |
                                    v              |
                          任意评审人做出最终决定      |
                                    |              |
            +---------------------+-+-------------+|
            |                     |               ||
            v                     v               v|
        APPROVED            NEED_IMPROVEMENT    REJECTED
            |                     |               |
            |                     +-------(允许重新提交)
            |                                     |
            v                                     |
更新Idea状态为SESSION_APPROVED                     |
            |                                     |
            v                                     |
        创建Incubator                              |
            |                                     |
            v                                     |
     IN_INCUBATION_REVIEW <----+                  |
            |                  |                  |
            v                  |                  |
   [评估提交个人结果(至少3名)]    |                  |
            |                  |                  |
            v                  |                  |
       达到最低评估数量           |                  |
            |                  |                  |
            v                  |                  |
   任意孵化成员做出最终决定        |                  |
            |                  |                  |
   +--------+---------+--------+                  |
   |                  |                           |
   v                  v                           |
APPROVED        NEED_IMPROVEMENT               REJECTED
   |                  |                           |
   |                  +-------(允许重新提交)--------+
   |
   v
更新Idea状态为INCUBATION_APPROVED
   |
   v
实施阶段(IMPLEMENTATION)
```

## 评审机制

### Session评审机制
1. **评审结果提交（第一步）**
   - 需要至少3名评审成员提交个人评审结果
   - 每位评审成员独立评价五个维度：创新性、价值、可行性、影响力和投资回报率
   - 每个维度评分范围为1-5分
   - 评审成员可以为每个维度提供详细评论
   - 系统记录每个评审人的评审结果，但不自动做出决定

2. **最终决定（第二步）**
   - 当收到至少3份评审结果后，系统通知所有评审成员可以做出最终决定
   - 任何一位评审成员可以查看所有评审结果（匿名方式）
   - 做出最终决定的评审成员需要综合考虑所有评审意见
   - 最终决定可以是APPROVED、REJECTED或NEED_IMPROVEMENT
   - 做出最终决定的评审成员需提供总结性评论
   - 对于REJECTED或NEED_IMPROVEMENT决定，可指定是否允许重新提交

### Incubator评审机制
1. **评估结果提交（第一步）**
   - 需要至少2名孵化成员提交个人评估结果
   - 每位孵化成员独立评价五个维度：创新性、价值、可行性、影响力和投资回报率
   - 每个维度评分范围为1-5分
   - 孵化成员可以为每个维度提供详细评论
   - 系统记录每个孵化成员的评估结果，但不自动做出决定

2. **最终决定（第二步）**
   - 当收到至少2份评估结果后，系统通知所有孵化成员可以做出最终决定
   - 任何一位孵化成员可以查看所有评估结果（匿名方式）
   - 做出最终决定的孵化成员需要综合考虑所有评估意见
   - 最终决定可以是APPROVED、REJECTED或NEED_IMPROVEMENT
   - 做出最终决定的孵化成员需提供总结性评论
   - 对于REJECTED或NEED_IMPROVEMENT决定，可指定是否允许重新提交

## 重新提交流程

### Session重新提交
1. Session被评审为"NEED_IMPROVEMENT"或"REJECTED"，且允许重新提交
2. 提交者收到详细反馈
3. 提交者在创意详情页选择"重新提交评审"
4. 系统更新现有Session并创建新版本(session_version+1)
5. 新版本通过previous_session_id关联到前一个版本
6. 用户完善Session内容并提交
7. 新版本Session进入评审流程

### Incubator重新提交
1. Incubator被评估为"NEED_IMPROVEMENT"或"REJECTED"，且允许重新提交
2. 提交者收到详细反馈
3. 提交者在创意详情页选择"重新提交孵化"
4. 系统更新现有Incubator并创建新版本(incubator_version+1)
5. 新版本通过previous_incubator_id关联到前一个版本
6. 用户完善Incubator内容并提交
7. 新版本Incubator进入孵化流程

## 通知机制

系统在以下节点发送通知:
1. 创建Session后，通知评审成员
2. Session评审达到最低评审数量时，通知所有评审成员可以做出最终决定
3. Session最终决定做出后，通知创意提交者
4. 创建Incubator后，通知孵化成员
5. Incubator评估达到最低评估数量时，通知所有孵化成员可以做出最终决定
6. Incubator最终决定做出后，通知创意提交者
7. 创意收到新评论时，通知创意提交者
8. 评论收到回复时，通知评论作者

## 前端页面设计

### 创意提交者视角

#### 1. 创意详情页面
- 显示创意基本信息
- 当前状态和阶段指示器
- 生命周期时间线
- 关联的Session和Incubator信息
- 操作按钮 (根据当前状态显示不同选项)

#### 2. Session创建/编辑页面
- 问题陈述表单
- 解决方案描述
- 价值主张说明
- 如果是重新提交，显示之前的反馈意见
- 提交按钮

#### 3. Incubator创建/编辑页面
- Lean Canvas编辑器
- POC详情编辑
- 如果是重新提交，显示之前的反馈意见
- 提交按钮

#### 4. Session/Incubator版本历史页面
- 显示特定Idea的Session或Incubator的所有版本
- 每个版本的基本信息
- 版本之间的变更对比
- 每个版本的评审/孵化结果

#### 5. 个人中心
- 我的创意列表 (按状态分组)
- 待评审的Session和待孵化的Incubator
- 需要重新提交的Session和Incubator提示
- 通知中心

### 评审成员视角

#### 1. 评审任务中心
- 待评审Session列表
- 进行中评审
- 已达最低评审数量的Session列表（可做最终决定）
- 已完成评审历史
- 进度统计

#### 2. 提交评审结果页面
- 显示Session信息和关联的Idea基本信息
- 问题陈述、解决方案和价值主张
- Session版本历史访问入口
- 评分表单 (五个维度)
- 评审意见输入
- 当前评审进度指示器（已提交数/最低要求数）
- 提交按钮

#### 3. 最终决定页面
- 仅当达到最低评审数量时可访问
- 显示Session信息摘要
- 所有评审结果汇总（匿名展示）
- 每个维度的平均分和评论集合
- 最终决定选项（APPROVED/REJECTED/NEED_IMPROVEMENT）
- 总结性评论输入框
- 重新提交选项配置（当决定为REJECTED或NEED_IMPROVEMENT）
- 提交最终决定按钮

### 孵化成员视角

#### 1. 孵化任务中心
- 待孵化Incubator列表
- 进行中孵化
- 已达最低评估数量的Incubator列表（可做最终决定）
- 已完成孵化历史
- 进度统计

#### 2. 提交评估结果页面
- 显示Incubator信息和关联的Idea基本信息
- Lean Canvas信息
- Incubator版本历史访问入口
- 评分表单（五个维度）
- 评估意见输入
- 当前评估进度指示器（已提交数/最低要求数）
- 提交按钮

#### 3. 最终决定页面
- 仅当达到最低评估数量时可访问
- 显示Incubator信息摘要
- 所有评估结果汇总（匿名展示）
- 每个维度的平均分和评论集合
- 最终决定选项（APPROVED/REJECTED/NEED_IMPROVEMENT）
- 总结性评论输入框
- 重新提交选项配置（当决定为REJECTED或NEED_IMPROVEMENT）
- 提交最终决定按钮

### 管理员视角

#### 1. 管理控制台
- 创意生命周期统计
- Session和Incubator进度监控
- 用户角色管理
- 系统配置
- 版本历史分析

#### 2. 评审配置
- 设置评审人数要求
- 配置决策规则
- 定义状态转换规则

## API设计

### 创意生命周期API

1. `POST /api/ideas` - 创建新创意
2. `GET /api/ideas/{id}` - 获取创意详情
3. `POST /api/ideas/{id}/session` - 创建或更新Session
4. `GET /api/ideas/{id}/session` - 获取创意的当前Session
5. `GET /api/sessions/{id}` - 获取Session详情
6. `POST /api/sessions/{id}/reviews` - 提交Session评审结果（第一步）
7. `POST /api/sessions/{id}/final-decision` - 提交Session最终决定（第二步）
8. `GET /api/sessions/{id}/reviews` - 获取Session的所有评审结果
9. `POST /api/ideas/{id}/incubator` - 创建或更新Incubator
10. `GET /api/ideas/{id}/incubator` - 获取创意的当前Incubator
11. `GET /api/incubators/{id}` - 获取Incubator详情
12. `POST /api/incubators/{id}/reviews` - 提交Incubator评估结果（第一步）
13. `POST /api/incubators/{id}/final-decision` - 提交Incubator最终决定（第二步）
14. `GET /api/incubators/{id}/reviews` - 获取Incubator的所有评估结果

### 版本管理API

1. `GET /api/sessions/{id}/versions` - 获取Session的所有版本
2. `GET /api/incubators/{id}/versions` - 获取Incubator的所有版本
3. `GET /api/sessions/{id}/previous` - 获取前一个版本的Session
4. `GET /api/incubators/{id}/previous` - 获取前一个版本的Incubator

### 评审/孵化任务API

1. `GET /api/reviews/sessions/pending` - 获取待评审Session
2. `GET /api/reviews/incubators/pending` - 获取待孵化Incubator
3. `GET /api/reviews/sessions/completed` - 获取已完成Session评审
4. `GET /api/reviews/incubators/completed` - 获取已完成Incubator评估
5. `GET /api/reviews/sessions/ready-for-decision` - 获取已达最低评审数量的Session
6. `GET /api/reviews/incubators/ready-for-decision` - 获取已达最低评估数量的Incubator

### 统计API

1. `GET /api/stats/ideas` - 获取创意统计
2. `GET /api/stats/sessions` - 获取Session统计
3. `GET /api/stats/incubators` - 获取Incubator统计
4. `GET /api/stats/resubmissions` - 获取重新提交统计
5. `GET /api/stats/reviews` - 获取评审结果统计
6. `GET /api/stats/final-decisions` - 获取最终决定统计

## 最佳实践

1. 创意提交者应尽量提供详细而清晰的问题陈述
2. 解决方案应具体且可行
3. Lean Canvas应完整填写所有关键部分
4. 评审和孵化成员应给出具体的建设性反馈
5. 评审时应独立思考，避免被其他评审人的意见影响
6. 做出最终决定时，应综合考虑所有评审意见，提供清晰的总结性评论
7. 允许重新提交时，应明确指出需要改进的方向
8. 重新提交时，应重点解决之前评审/孵化中指出的问题

## 总结

Idea Wall平台基于独立实体模型，将Idea、Idea Session和Idea Incubator作为一对一关联的实体，实现了灵活而强大的创意管理流程。系统采用两步评审机制：先收集多名评审成员的独立意见，再由任一评审成员在达到最低评审数量后做出最终决定。这种设计既确保了决策的公正性，又提高了流程的效率，同时保持了评审和孵化过程的独立迭代能力。系统支持创意从提交到实施的全流程管理，为团队提供了完善的创意评估和孵化机制，促进创新发展。
