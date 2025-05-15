参考点赞功能，实现收藏Idea功能。代码风格和页面样式都参考点赞功能。

# MongdDB Collection 结构
Collection Name: bookmarks
Stores user's bookmark ideas.

| Field           | Type     | Description                   | Example Value              |
|-----------------|----------|-------------------------------|----------------------------|
| bookmark_status | Number   | Bookmark status (0 or 1)      | 1                          |
| target_id       | String   | ID of idea/comment            | "507f1f77bcf86cd799439015" |
| target_type     | String   | "Idea" or "Comment"           | "Idea"                     |
| created_at      | DateTime | When the record was created   | 2024-03-20T10:30:00Z       |
| creator_id      | String   | Who created the record        | "user123"                  |
| creator_name    | String   | Who created the record        | "John Doe"                 |
| updated_at      | DateTime | When last updated             | 2024-03-21T15:45:00Z       |
| updater_id      | String   | Who performed the last update | "user123"                  |
| updater_name    | String   | Who performed the last update | "John Doe"                 |

# 关联表
给ideas Collection添加一个total_bookmarks字段，记录收藏该Idea的用户总数

# 功能描述
该表主要记录用户收藏喜爱的Ideas。
1. 在idea-wall.component页面上，Comments总数icon旁边展示Bookmarks总数。
2. 获取ideas列表时，要判断当前用户有没有收藏该idea，从bookmarks collection查找是否存在对应的idea_id和creator_id，且bookmark_statue为1的记录，存在则表示当前登录用户已经收藏过该idea，Favoirtes icon为高亮。否则Bookmarks icon为普通状态。
3. 如果用户已经收藏了当前idea，点击Bookmarks icon取消收藏，把DB中对应idea_id和creator_id记录的bookmark_status更新为0；否则，点击Bookmarks icon收藏该idea，把DB中对应idea_id和creator_id记录的bookmark_status更新为1。
4. 实现一个"My Bookmarks" Filter，放在idea-wall.component页面上"My Ideas" Filter边上，选中时只显示我已经收藏的Ideas。My Ideas和My Bookmarks是两个独立的Filter，可以同时选中表示即是我创建的Idea，又被我收藏的Idea。也可以单独选中。