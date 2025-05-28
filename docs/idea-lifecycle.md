# Idea Wall生命周期流程文档

## 概述

Idea Wall平台提供了一个结构化的创意管理流程，从创意提交到最终实施。本文档详细说明了创意的生命周期，包括各阶段的流程、参与角色及系统交互。

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
2. 创建Ideas记录，初始化status为"DRAFT"
3. 初始化相关计数器 (votes, comments, bookmarks)
4. 记录操作日志到Logs Collection

### 2. 评审阶段 (Session Review)

最低评审数量为2（仅适用于通过决定）

#### 数据流
- 更新Ideas的session_review对象
- 更新Ideas的status为"IN_SESSION_REVIEW"
- 创建相关通知

#### 前端流程 (创意提交者)
1. 用户选择自己创建的创意提交评审
2. 填写评审申请表单，包括:
   - problem_statements: 问题陈述
   - solutions: 解决方案
   - values: 价值主张
3. 提交后，系统更新Ideas记录的session_review对象
4. 如果评审结果为"NEED_IMPROVEMENT":
   - 可以查看详细的反馈意见
   - 修改session_review信息并重新提交评审

#### 前端流程 (评审成员)
1. 评审成员在评审任务中心查看待审核创意
2. 选择创意进入评审详情页
3. 查看session_review信息和评审申请
4. **提交评审结果（第一步）**:
   - 填写评分和评论 (创新性、价值、可行性、影响力和投资回报率)
   - 提交个人评审结果，系统记录该评审人的意见
   - 页面显示当前评审数量
5. **做出最终决定（第二步）**:
   - 任何评审成员可以随时做出最终决定
   - 点击"做出最终决定"选项，进入最终决定页面
   - 查看所有评审成员的评分和意见（如有）
   - 选择最终决定（APPROVED/REJECTED/NEED_IMPROVEMENT）
   - **APPROVED决定**：需要至少2名评审成员提交评审结果
   - **REJECTED和NEED_IMPROVEMENT决定**：无需等待最低评审数量，可随时做出
   - 填写总结性评论
   - 提交最终决定

#### 后端处理
1. 更新Ideas记录的session_review对象:
   - 设置status为"IN_REVIEW"
   - 更新idea的status为"IN_SESSION_REVIEW"
2. **处理单独评审结果（第一步）**:
   - 接收并保存评审人员提交的评审结果到Idea Review Collection
   - 更新session_review的review_count计数
3. **处理最终决定（第二步）**:
   - 对于APPROVED决定：验证评审数量是否达到最低要求（2个）
   - 对于REJECTED和NEED_IMPROVEMENT决定：无最低评审数量要求
   - 保存最终决定到Final Decision Collection
   - 更新Ideas的status（如SESSION_APPROVED、SESSION_REJECTED等）
   - 发送通知给创意提交者
4. 记录操作日志

### 3. 孵化阶段 (Incubator Review)

最低评估数量为2（仅适用于通过决定）

#### 数据流
- 更新Ideas的incubator_review对象
- 更新Ideas的status为"IN_INCUBATOR_REVIEW"
- 创建相关通知

#### 前端流程 (创意提交者)
1. Session通过评审后，提交者收到通知
2. 在创意详情页选择"提交孵化申请"
3. 填写Lean Canvas表单
4. 提交后，系统更新Ideas记录的incubator_review对象
5. 如果评估结果为"NEED_IMPROVEMENT":
   - 可以查看详细的反馈意见
   - 修改incubator_review信息并重新提交孵化

#### 前端流程 (孵化成员)
1. 孵化成员在孵化任务中心查看待评估创意
2. 选择创意进入孵化评估页面
3. 查看incubator_review信息
4. **提交评估结果（第一步）**:
   - 填写评分和评论 (创新性、价值、可行性、影响力和投资回报率)
   - 提交个人评估结果，系统记录该孵化成员的意见
   - 页面显示当前评估数量
5. **做出最终决定（第二步）**:
   - 任何孵化成员可以随时做出最终决定
   - 点击"做出最终决定"选项，进入最终决定页面
   - 查看所有孵化成员的评分和意见（如有）
   - 选择最终决定（APPROVED/REJECTED/NEED_IMPROVEMENT）
   - **APPROVED决定**：需要至少2名孵化成员提交评估结果
   - **REJECTED和NEED_IMPROVEMENT决定**：无需等待最低评估数量，可随时做出
   - 填写总结性评论
   - 提交最终决定

#### 后端处理
1. 更新Ideas记录的incubator_review对象:
   - 设置status为"IN_REVIEW"
   - 更新idea的status为"IN_INCUBATOR_REVIEW"
2. **处理单独评估结果（第一步）**:
   - 接收并保存孵化成员提交的评估结果到Idea Review Collection
   - 更新incubator_review的review_count计数
3. **处理最终决定（第二步）**:
   - 对于APPROVED决定：验证评估数量是否达到最低要求（2个）
   - 对于REJECTED和NEED_IMPROVEMENT决定：无最低评估数量要求
   - 保存最终决定到Final Decision Collection
   - 更新Ideas的status（如INCUBATOR_APPROVED、INCUBATOR_REJECTED等）
   - 发送通知给创意提交者
4. 记录操作日志

### 4. 实施阶段

#### 数据流
- 更新Ideas的status为"ROUL_OUT"

#### 前端流程
1. 创意通过孵化后，进入实施阶段
2. 系统可提供项目管理工具进行跟踪
3. 提交者和相关人员可更新实施进度

#### 后端处理
1. 更新Ideas的status为"ROUL_OUT"
2. 定期更新实施进度
3. 记录操作日志

## 状态流转图

```
创建Idea [DRAFT]
      ↓
提交Session Review → [IN_SESSION_REVIEW] → 评审提交个人结果
      ↓                                  ↓
                               达到最低评审数量 → 任意评审人做出最终决定
                                                  ↓
              +----------------+------------------+
              ↓                ↓                  ↓
         APPROVED        NEED_IMPROVEMENT    REJECTED
              ↓                ↓
              ↓      用户修改重新提交
              ↓
提交Incubator Review → [IN_INCUBATOR_REVIEW] → 评估提交个人结果
              ↓                              ↓
                               达到最低评估数量 → 任意评审人做出最终决定
                                                 ↓
              +----------------+-----------------+
              ↓                ↓                 ↓
         APPROVED        NEED_IMPROVEMENT    REJECTED
              ↓                ↓
              ↓      用户修改重新提交
              ↓
      [ROUL_OUT]
```

## 评审机制

### Session评审机制
1. **评审结果提交（第一步）**
   - 评审成员可以随时提交个人评审结果
   - 每位评审成员独立评价五个维度：创新性、价值、可行性、影响力和投资回报率
   - 每个维度评分范围为1-5分
   - 评审成员可以为每个维度提供详细评论
   - 系统记录每个评审人的评审结果，但不自动做出决定

2. **最终决定（第二步）**
   - 任何评审成员可以随时做出最终决定，无需等待特定评审数量
   - **APPROVED决定要求**：必须有至少2名评审成员提交评审结果
   - **REJECTED和NEED_IMPROVEMENT决定**：无最低评审数量要求，可在任何时候做出
   - 做出最终决定的评审成员需要综合考虑所有已有评审意见
   - 做出最终决定的评审成员需提供总结性评论

### Incubator评审机制
1. **评估结果提交（第一步）**
   - 孵化成员可以随时提交个人评估结果
   - 每位孵化成员独立评价五个维度：创新性、价值、可行性、影响力和投资回报率
   - 每个维度评分范围为1-5分
   - 孵化成员可以为每个维度提供详细评论
   - 系统记录每个孵化成员的评估结果，但不自动做出决定

2. **最终决定（第二步）**
   - 任何孵化成员可以随时做出最终决定，无需等待特定评估数量
   - **APPROVED决定要求**：必须有至少2名孵化成员提交评估结果
   - **REJECTED和NEED_IMPROVEMENT决定**：无最低评估数量要求，可在任何时候做出
   - 做出最终决定的孵化成员需要综合考虑所有已有评估意见
   - 做出最终决定的孵化成员需提供总结性评论

## 通知机制

系统在以下节点发送通知:
1. 提交Session Review后，通知评审成员
2. Session最终决定做出后，通知创意提交者
3. 提交Incubator Review后，通知孵化成员
4. Incubator最终决定做出后，通知创意提交者
5. 创意收到新评论时，通知创意提交者
6. 评论收到回复时，通知评论作者

## 最佳实践

1. 创意提交者应尽量提供详细而清晰的问题陈述
2. 解决方案应具体且可行
3. Lean Canvas应完整填写所有关键部分
4. 评审和孵化成员应给出具体的建设性反馈
5. 评审时应独立思考，避免被其他评审人的意见影响
6. 做出最终决定时，应综合考虑所有评审意见，提供清晰的总结性评论
7. 重新提交时，应重点解决之前评审/孵化中指出的问题

## 总结

Idea Wall平台实现了一个简化但完整的创意管理流程。系统采用两步评审机制：先收集多名评审成员的独立意见，再由任一评审成员在达到最低评审数量后做出最终决定。这种设计既确保了决策的公正性，又提高了流程的效率。系统支持创意从提交到实施的全流程管理，为团队提供了完善的创意评估和孵化机制，促进创新发展。
