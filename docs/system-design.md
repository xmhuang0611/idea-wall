### 系统首页
1. 系统首页展示Ideas列表，分页展示，用户可选择每页展示多少条。
2. 列表上方有一个Button Group，有Idea、Pain、Thought三个快速Categories Filter Button，点击只展示该类型的Ideas。
3. 列表上方有搜索按钮，支持按关键字模糊匹配Idea Title搜索；搜索框右侧是排序选项，可以按发表时间、点赞数升序或降序排序。
4. 如果用户没有登录，在首页右上方展示登录按钮，点击登录按钮调用OAuth登录。
5. 如果用户登录成功，在首页右上方展示用户信息，点击用户头像有下拉菜单查看该用户发布的Ideas，该用户收藏的Ideas。
6. Ideas列表右上方有一个发布按钮。如果用户已登录该用户为enabled，点击弹出模态框发表Idea，否则为disabled。
7. 每条Idea前面有一个按钮展示该Idea的点赞数。如果当前用户已点赞该Idea，则这个按钮是高亮的，点击取消点赞；否认为正常状态，点击点赞该Idea。
8. 每条Idea下面有评论、收藏按钮，评论按钮上同时展示当前Idea的总评论数，收藏按钮上同时展示当前Idea的收藏总数。如果当前用户已收藏该Idea，则收藏按钮为高亮状态，点击取消收藏；否则收藏按钮为正常状态，点击收藏。



### 发表Idea功能
1. 用户登录系统后，首页Ideas列表右上方的“发布”按钮为Enabled状态，点击该按钮弹出模态框发布Idea；
2. Idea有一个Title字段，必填；
3. Idea有一个category字段，可以选择Idea、Pain、Thought选项，必填；
4. Idea有一个Feeling字段，表示发表该Idea的心情，是一个表情图案，数据库存number类型，展示时转换为表情图；
5. 可以给Idea加上Tags，从Tags Collection表拉取Tags，数据库存Tags Id，是一个数组；
6. Idea有一个Description字段，界面是一个富文本编辑器；
7. created_at为当前时间，created_by_id当前用户user_id，created_by_name为当前用户name；
8. updated_at为当前时间，updated_by_id当前用户user_id，updated_by_name为当前用户name；
9. 发表Idea成功时同时往Logs表插入一条Log记录，object为“Idea”，object_id为Idea Id，object_data为保存后的Idea记录的json字符串，created_at为当前时间，created_by_id当前用户user_id，created_by_name为当前用户name。


### 编辑Idea功能
1. 在Idea列表页面，如果是当前用户发布的Idea，下方展示一个Edit按钮，点击弹出模态框编辑Idea，编辑界面和发表Idea界面一致，自动填充Idea字段。保存Idea时不改变created_at，created_by_id，created_by_name，只更新updated_at，updated_by_id，updated_by_name字段。


### 发表评论功能
1. 如果已经登录系统，点击Idea列表页面每条Idea下面的评论按钮，弹出模态框分页展示该Idea的所有评论。最上方还有一个富文本编辑器可以对Idea进行评论，评论保存在Comments Collection中，idea_id为评论的Idea Id，parent_id为空。
2. 也可以对某一条评论进行评论，idea_id为评论的Idea Id，parent_id为被评论的评论Id。



### Audit字段填充及系统日志记录
1. 新增记录时：created_at为当前时间，created_by_id当前用户user_id，created_by_name为当前用户name；updated_at为当前时间，updated_by_id当前用户user_id，updated_by_name为当前用户name；
2. 编辑记录时，不改变created_at，created_by_id，created_by_name，只更新updated_at，updated_by_id，updated_by_name字段。
3. 只要更新了数据就要往Logs表插入一条Log记录，object为更新的记录类别，object_id为更新记录的Id，object_data为保存后的记录的json字符串，created_at为当前时间，created_by_id当前用户user_id，created_by_name为当前用户name。