在上一级目录中运行如下命令(该目录中必须有./resources文件夹, 文件夹中包含icon.png和splash.psd模板; 该目录中必须包含config.xml文件, 该命令生成资源后会重写config.xml文件):
```bash
$ ionic resources ios  # 如果没有platform added, 则需要指定平台生成资源, 加参数ios
$ ionic resources android  # 同上
$ ionic resources --icon  # 只生成icon
$ ionic resources --splash  # 只生成splash
```