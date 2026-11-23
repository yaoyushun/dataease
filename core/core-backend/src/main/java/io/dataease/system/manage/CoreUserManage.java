package io.dataease.system.manage;

import io.dataease.bluewing.dao.entity.PerUser;
import io.dataease.bluewing.dao.repo.PerUserRepository;
import io.dataease.license.config.XpackInteract;
import io.dataease.utils.CommonBeanFactory;
import org.springframework.stereotype.Component;

@Component
public class CoreUserManage {


    @XpackInteract(value = "coreUserManage", replace = true)
    public String getUserName(Long uid) {
        if (uid == null) {
            return "管理员";
        }
        PerUserRepository repo = CommonBeanFactory.getBean(PerUserRepository.class);
        if (repo != null) {
            PerUser u = repo.findById(uid).orElse(null);
            if (u != null) {
                return "i18n_sys_admin".equals(u.getName()) ? "管理员" : u.getName();
            }
        }
        return "管理员";
    }
}
