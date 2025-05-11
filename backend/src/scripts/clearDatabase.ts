import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('开始清空数据库...');

    // 删除所有密码项
    const deletedPasswordItems = await prisma.passwordItem.deleteMany({});
    console.log(`已删除 ${deletedPasswordItems.count} 条密码记录`);

    // 删除所有用户
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`已删除 ${deletedUsers.count} 个用户`);

    console.log('数据库清空完成！');
  } catch (error) {
    console.error('清空数据库时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
